/**
 * Système de validation pour les formulaires de réservation
 * Vérifie les données saisies par les clients
 */

const Validator = {
  /**
   * Valide un email
   */
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) && email.length <= 100;
  },

  /**
   * Valide un numéro de téléphone (format algérien: +213 ou 0)
   */
  isValidPhone(phone) {
    // Accepte formats: +213... ou 0... ou 0798... (min 10 chiffres)
    const regex = /^(\+213|0)[0-9]{9}$/;
    return regex.test(phone.replace(/\s/g, ''));
  },

  /**
   * Valide un nom (min 3 caractères, pas de chiffres au début)
   */
  isValidName(name) {
    const trimmed = name.trim();
    return trimmed.length >= 3 && trimmed.length <= 50 && /^[a-zA-ZÀ-ÿ\s'-]/.test(trimmed);
  },

  /**
   * Valide un nombre de participants
   */
  isValidParticipants(num) {
    const n = parseInt(num);
    return !isNaN(n) && n >= 1 && n <= 50;
  },

  /**
   * Valide une date (doit être dans le futur)
   */
  isValidDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(date) && date >= today;
  },

  /**
   * Valide un prix
   */
  isValidPrice(price) {
    const num = parseFloat(price);
    return !isNaN(num) && num > 0;
  },

  /**
   * Valide une demande spéciale (optionnel, max 500 caractères)
   */
  isValidSpecialRequests(text) {
    return !text || text.length <= 500;
  },

  /**
   * Valide un objet de réservation complet
   * Retourne un objet avec validation et erreurs
   */
  validateReservation(data) {
    const errors = {};
    const warnings = [];

    // Validations obligatoires
    if (!data.fullName || !this.isValidName(data.fullName)) {
      errors.fullName = 'Le nom doit contenir au moins 3 caractères';
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.email = 'Email invalide. Format: example@domain.com';
    }

    if (!data.phone || !this.isValidPhone(data.phone)) {
      errors.phone = 'Téléphone invalide. Format: +213XXXXXXXXX ou 0XXXXXXXXX';
    }

    if (!data.participants || !this.isValidParticipants(data.participants)) {
      errors.participants = 'Nombre de participants invalide (1-50)';
    }

    // Validations optionnelles
    if (data.specialRequests && !this.isValidSpecialRequests(data.specialRequests)) {
      errors.specialRequests = 'Les demandes spéciales ne doivent pas dépasser 500 caractères';
    }

    // Avertissements (non-bloquants)
    if (data.email && data.email.includes('+')) {
      warnings.push('L\'email contient un "+". Assurez-vous que c\'est correct.');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      data: data
    };
  },

  /**
   * Valide tous les champs d'une réservation et retourne les erreurs
   */
  getValidationErrors(formData) {
    const errors = {};

    // Champ: fullName
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Le nom complet est requis';
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = 'Le nom doit contenir au moins 3 caractères';
    } else if (formData.fullName.length > 50) {
      errors.fullName = 'Le nom ne doit pas dépasser 50 caractères';
    }

    // Champ: email
    if (!formData.email?.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!this.isValidEmail(formData.email)) {
      errors.email = 'Format email invalide (exemple: contact@domain.com)';
    }

    // Champ: phone
    if (!formData.phone?.trim()) {
      errors.phone = 'Le téléphone est requis';
    } else if (!this.isValidPhone(formData.phone)) {
      errors.phone = 'Format invalide. Utilisez +213XXXXXXXXX ou 0XXXXXXXXX';
    }

    // Champ: participants
    if (!formData.participants) {
      errors.participants = 'Nombre de participants requis';
    } else if (!this.isValidParticipants(formData.participants)) {
      errors.participants = 'Doit être entre 1 et 50 personnes';
    }

    // Champ: specialRequests (optionnel)
    if (formData.specialRequests && !this.isValidSpecialRequests(formData.specialRequests)) {
      errors.specialRequests = 'Maximum 500 caractères autorisés';
    }

    return errors;
  },

  /**
   * Nettoie et formate les données
   */
  sanitizeData(data) {
    return {
      fullName: data.fullName?.trim() || '',
      email: data.email?.trim().toLowerCase() || '',
      phone: data.phone?.trim().replace(/\s/g, '') || '',
      participants: parseInt(data.participants) || 1,
      specialRequests: data.specialRequests?.trim() || '',
      timestamp: new Date().toISOString(),
      type: data.type || 'destination',
      status: data.status || 'pending',
      totalPrice: parseFloat(data.totalPrice) || 0
    };
  }
};

/**
 * Classe utilitaire pour afficher les erreurs
 */
class FormValidator {
  constructor(formElement) {
    this.form = formElement;
    this.errorContainer = null;
  }

  /**
   * Affiche les erreurs sous le formulaire
   */
  showErrors(errors) {
    // Supprimer les erreurs précédentes
    const existingErrors = this.form.querySelector('.validation-errors');
    if (existingErrors) existingErrors.remove();

    if (Object.keys(errors).length === 0) return;

    // Créer le conteneur d'erreurs
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-errors';
    errorDiv.style.cssText = `
      background: #fee2e2;
      border: 2px solid #ef4444;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      color: #991b1b;
      font-weight: 500;
    `;

    const errorTitle = document.createElement('h4');
    errorTitle.textContent = '❌ Erreurs de validation:';
    errorTitle.style.marginTop = '0';
    errorDiv.appendChild(errorTitle);

    const errorList = document.createElement('ul');
    errorList.style.cssText = 'margin: 10px 0 0 20px; padding: 0;';

    Object.entries(errors).forEach(([field, message]) => {
      const li = document.createElement('li');
      li.textContent = message;
      li.style.marginBottom = '5px';
      errorList.appendChild(li);

      // Ajouter une classe d'erreur au champ
      const fieldInput = this.form.querySelector(`[name="${field}"]`);
      if (fieldInput) {
        fieldInput.style.borderColor = '#ef4444';
        fieldInput.style.borderWidth = '2px';
      }
    });

    errorDiv.appendChild(errorList);
    this.form.insertBefore(errorDiv, this.form.firstChild);
  }

  /**
   * Efface les messages d'erreur
   */
  clearErrors() {
    const existingErrors = this.form.querySelector('.validation-errors');
    if (existingErrors) existingErrors.remove();

    // Réinitialiser les bordures
    this.form.querySelectorAll('input, textarea, select').forEach(field => {
      field.style.borderColor = '';
      field.style.borderWidth = '';
    });
  }

  /**
   * Valide et soumet le formulaire
   */
  submit(callback) {
    this.clearErrors();

    // Collecter les données
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData);

    // Valider
    const errors = Validator.getValidationErrors(data);

    if (Object.keys(errors).length > 0) {
      this.showErrors(errors);
      return false;
    }

    // Si valide, nettoyer et passer au callback
    const cleanData = Validator.sanitizeData(data);
    callback(cleanData);
    return true;
  }
}

/**
 * Sauvegarde sécurisée dans localStorage
 */
function saveReservation(reservation) {
  // Valider avant de sauvegarder
  const validation = Validator.validateReservation(reservation);

  if (!validation.isValid) {
    console.error('Erreurs de validation:', validation.errors);
    return false;
  }

  try {
    // Récupérer les réservations existantes
    const existing = JSON.parse(localStorage.getItem('allReservations') || '[]');

    // Ajouter la nouvelle. Vérifier les doublons
    const isDuplicate = existing.some(r =>
      r.email === reservation.email &&
      new Date(r.timestamp).getTime() > Date.now() - 3600000 // moins d'1h
    );

    if (isDuplicate) {
      console.warn('Une réservation similaire existe. Doublon détecté.');
      return false;
    }

    // Ajouter et sauvegarder
    existing.push(reservation);
    localStorage.setItem('allReservations', JSON.stringify(existing));

    // Affichier les avertissements
    if (validation.warnings.length > 0) {
      console.warn('Avertissements:', validation.warnings);
    }

    console.log('Réservation sauvegardée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return false;
  }
}
