/**
 * Système de sécurité avancé pour les réservations
 * Protection contre les données frauduleuses
 */

class SecurityValidator {
  /**
   * Vérifie si l'email est vraiment actif (simulation - en production, envoyez un email)
   */
  static async verifyEmailAddress(email) {
    // En production avec un VRAI backend:
    // 1. Envoyer un email de confirmation avec lien unique
    // 2. Ne confirmer la réservation que si l'utilisateur clique le lien
    // 3. Enregistrer le timestamp de vérification

    const existingVerified = this.getVerifiedEmails();
    return existingVerified.includes(email);
  }

  /**
   * Récupère la liste des emails vérifiés
   */
  static getVerifiedEmails() {
    return JSON.parse(localStorage.getItem('verifiedEmails') || '[]');
  }

  /**
   * Marquer un email comme vérifié (après clic confirmation)
   */
  static markEmailAsVerified(email) {
    const verified = this.getVerifiedEmails();
    if (!verified.includes(email)) {
      verified.push(email);
      localStorage.setItem('verifiedEmails', JSON.stringify(verified));
    }
  }

  /**
   * Vérifier qu'un téléphone n'a pas trop de réservations (éviter spam)
   */
  static checkPhoneRateLimit(phone, maxPerDay = 5) {
    const allReservations = JSON.parse(localStorage.getItem('allReservations') || '[]');
    const today = new Date().toDateString();

    const countToday = allReservations.filter(r => {
      const resDate = new Date(r.timestamp).toDateString();
      return r.phone === phone && resDate === today;
    }).length;

    return {
      isAllowed: countToday < maxPerDay,
      currentCount: countToday,
      remaining: Math.max(0, maxPerDay - countToday)
    };
  }

  /**
   * Vérifie qu'un IP n'a pas trop de réservations (éviter automatisation)
   */
  static checkIPRateLimit(maxPerDay = 20) {
    // Note: localStorage ne peut pas accéder à l'IP client
    // C'est pourquoi il FAUT un backend!
    console.warn('⚠️ La vérification IP requiert un serveur backend');
    return { isAllowed: true };
  }

  /**
   * Détecte les anomalies dans les données
   */
  static detectAnomalies(reservation) {
    const anomalies = [];

    // 1. Email professionnel suspect
    const disposableEmails = ['temp-mail.com', '10minutemail.com', 'guerrillamail.com'];
    if (disposableEmails.some(d => reservation.email?.includes(d))) {
      anomalies.push('⚠️ Email temporaire détecté');
    }

    // 2. Nom trop court ou suspects
    if (reservation.fullName?.length < 5) {
      anomalies.push('⚠️ Nom inhabituellement court');
    }

    // 3. Trop de participants pour un hébergement
    if (reservation.participants > 20) {
      anomalies.push('⚠️ Nombre anormal de participants');
    }

    // 4. Téléphone suspecte (trop de réservations)
    const phoneLimit = this.checkPhoneRateLimit(reservation.phone);
    if (!phoneLimit.isAllowed) {
      anomalies.push(`⚠️ Trop de réservations pour ce téléphone (${phoneLimit.currentCount}/${phoneLimit.remaining})`);
    }

    // 5. Prix anormalement bas/haut
    if (reservation.totalPrice && reservation.totalPrice < 500) {
      anomalies.push('⚠️ Prix anormalement bas');
    }

    return anomalies;
  }

  /**
   * Ajoute des métadonnées de sécurité
   */
  static addSecurityMetadata(reservation) {
    return {
      ...reservation,
      // Métadonnées de sécurité
      _security: {
        verificationToken: this.generateToken(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        verified: false,
        verificationEmailSent: false,
        ipAddress: 'unknown' // Nécessite un backend
      }
    };
  }

  /**
   * Génère un token de vérification unique
   */
  static generateToken() {
    return 'verif_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Enregistre chaque tentative de réservation (audit trail)
   */
  static logAttempt(reservation, success, errors = []) {
    const log = {
      timestamp: new Date().toISOString(),
      email: reservation.email,
      phone: reservation.phone,
      success: success,
      errors: errors,
      dataHash: this.hashData(reservation)
    };

    const logs = JSON.parse(localStorage.getItem('reservationLogs') || '[]');
    logs.push(log);

    // Garder seulement les 1000 derniers logs
    if (logs.length > 1000) {
      logs.shift();
    }

    localStorage.setItem('reservationLogs', JSON.stringify(logs));
  }

  /**
   * Crée un hash des données pour détection de duplicatas
   */
  static hashData(data) {
    const str = JSON.stringify({
      email: data.email,
      phone: data.phone,
      fullName: data.fullName
    });
    return 'hash_' + str.length + '_' + str.charCodeAt(0);
  }

  /**
   * Détecte les données dupliquées suspectes
   */
  static detectDuplicates(reservation) {
    const allReservations = JSON.parse(localStorage.getItem('allReservations') || '[]');
    const recentWindow = 3600000; // 1 heure

    const duplicates = allReservations.filter(r => {
      const timeDiff = Date.now() - new Date(r.timestamp).getTime();

      // Même email dans l'heure
      if (r.email === reservation.email && timeDiff < recentWindow) {
        return true;
      }

      // Même téléphone + même nom dans l'heure
      if (r.phone === reservation.phone && 
          r.fullName === reservation.fullName && 
          timeDiff < recentWindow) {
        return true;
      }

      return false;
    });

    return {
      isDuplicate: duplicates.length > 0,
      count: duplicates.length,
      duplicates: duplicates
    };
  }

  /**
   * Applique TOUTES les vérifications de sécurité
   */
  static async validateWithSecurity(reservation) {
    const result = {
      isValid: false,
      errors: [],
      warnings: [],
      anomalies: [],
      duplicates: null
    };

    // 1. Vérifier les anomalies
    const anomalies = this.detectAnomalies(reservation);
    if (anomalies.length > 0) {
      result.anomalies = anomalies;
      result.warnings.push('⚠️ Données suspectes détectées');
    }

    // 2. Vérifier les duplicatas
    const duplicateCheck = this.detectDuplicates(reservation);
    if (duplicateCheck.isDuplicate) {
      result.errors.push('❌ Réservation en doublon détectée');
      result.duplicates = duplicateCheck;
    }

    // 3. Vérifier la limite de débit (rate limit)
    const phoneLimit = this.checkPhoneRateLimit(reservation.phone);
    if (!phoneLimit.isAllowed) {
      result.errors.push(`❌ Trop de réservations. Limite atteinte. Réessayez demain.`);
    }

    // 4. Validation basique
    if (!Validator.isValidEmail(reservation.email)) {
      result.errors.push('Email invalide');
    }
    if (!Validator.isValidPhone(reservation.phone)) {
      result.errors.push('Téléphone invalide');
    }
    if (!Validator.isValidName(reservation.fullName)) {
      result.errors.push('Nom invalide');
    }

    // 5. Marquer comme non vérifié par défaut
    result.verified = false;

    // Résultat final
    result.isValid = result.errors.length === 0;

    return result;
  }
}

/**
 * Gestionnaire de confirmation par email
 * (À intégrer avec un backend réel)
 */
class EmailVerification {
  /**
   * Simuler l'envoi d'un email de vérification
   * En production: utiliser Node.js/Express + Nodemailer
   */
  static async sendVerificationEmail(reservation) {
    const token = SecurityValidator.generateToken();

    // Sauvegarder le token d'attente
    const pending = JSON.parse(localStorage.getItem('pendingVerifications') || '{}');
    pending[reservation.email] = {
      reservation: reservation,
      token: token,
      timestamp: Date.now(),
      expiresAt: Date.now() + 86400000 // 24 heures
    };
    localStorage.setItem('pendingVerifications', JSON.stringify(pending));

    console.log('📧 Email de vérification SIMULÉ pour:', reservation.email);
    console.log('🔗 Lien de vérification:', `reservation.html?verify=${token}`);

    // En production, faire ceci sur le serveur:
    /*
    const mailOptions = {
      from: 'noreply@visitbejaia.com',
      to: reservation.email,
      subject: '✉️ Confirmez votre réservation - VisitBejaia',
      html: `
        <h2>Merci pour votre réservation!</h2>
        <p>Veuillez cliquer sur le lien ci-dessous pour confirmer:</p>
        <a href="https://visitbejaia.com/reservation.html?verify=${token}">
          Confirmer mon email
        </a>
        <p>Ce lien expire dans 24 heures</p>
      `
    };
    // transporter.sendMail(mailOptions, ...);
    */

    return token;
  }

  /**
   * Vérifier le lien cliqué par l'utilisateur
   */
  static verifyToken(token) {
    const pending = JSON.parse(localStorage.getItem('pendingVerifications') || '{}');

    for (const [email, data] of Object.entries(pending)) {
      if (data.token === token) {
        // Vérifier que le token n'a pas expiré
        if (data.expiresAt > Date.now()) {
          // Token valide!
          SecurityValidator.markEmailAsVerified(email);
          
          // Déplacer vers les réservations confirmées
          SecurityValidator.addSecurityMetadata(data.reservation);
          
          // Nettoyer
          delete pending[email];
          localStorage.setItem('pendingVerifications', JSON.stringify(pending));

          return {
            isValid: true,
            email: email,
            reservation: data.reservation
          };
        } else {
          return { isValid: false, error: 'Token expiré' };
        }
      }
    }

    return { isValid: false, error: 'Token invalide' };
  }

  /**
   * Récupérer les réservations en attente de vérification
   */
  static getPendingReservations() {
    const pending = JSON.parse(localStorage.getItem('pendingVerifications') || '{}');
    return Object.values(pending);
  }
}

/**
 * Bouclier CAPTCHA simple (protection anti-bot)
 */
class SimpleCaptcha {
  /**
   * Générer une question mathématique
   */
  static generateQuestion() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let answer;
    if (operator === '+') {
      answer = num1 + num2;
    } else {
      answer = num1 - num2;
    }

    return {
      question: `Combien font ${num1} ${operator} ${num2} ?`,
      answer: answer,
      id: Math.random().toString(36).substr(2, 9)
    };
  }

  /**
   * Vérifier la réponse CAPTCHA
   */
  static verifyAnswer(answer, correctAnswer) {
    return parseInt(answer) === correctAnswer;
  }
}
