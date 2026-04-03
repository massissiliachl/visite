const Reservation = require('../models/Reservation');
const Blocked = require('../models/Blocked'); // ⚡ On ajoute la table des dates bloquées
const nodemailer = require('nodemailer');

// Configuration email (à adapter selon votre fournisseur)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail', // ou votre fournisseur (outlook, yahoo, etc.)
  auth: {
    user: process.env.EMAIL_USER || 'votre-email@gmail.com', // ⚠️ À configurer dans .env
    pass: process.env.EMAIL_PASS || 'votre-mot-de-passe-app'  // ⚠️ Mot de passe d'application Gmail
  }
});

// Fonction pour notifier l'admin par email
async function notifyAdminNewReservation(reservation) {
  if (!reservation.transaction_ref) return; // Ne notifier que si paiement manuel

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL || 'admin@visitbejaia.com', // ⚠️ Email admin à configurer
    subject: `Nouvelle réservation avec paiement - ${reservation.nom_item}`,
    html: `
      <h2>Nouvelle réservation en attente de validation</h2>
      <p><strong>Client:</strong> ${reservation.nom} ${reservation.prenom}</p>
      <p><strong>Email:</strong> ${reservation.email}</p>
      <p><strong>Téléphone:</strong> ${reservation.telephone}</p>
      <p><strong>Activité:</strong> ${reservation.nom_item}</p>
      <p><strong>Date:</strong> ${reservation.date_depart ? new Date(reservation.date_depart).toLocaleDateString('fr-FR') : 'N/A'}</p>
      <p><strong>Participants:</strong> ${reservation.nb_personnes}</p>
      <p><strong>Prix total:</strong> ${reservation.prix_total?.toLocaleString('fr-DZ')} DZD</p>
      <p><strong>Acompte 30%:</strong> ${reservation.acompte_30pct?.toLocaleString('fr-DZ')} DZD</p>
      <p><strong>Mode paiement:</strong> ${reservation.mode_paiement}</p>
      <p><strong>N° transaction:</strong> <strong style="color: #d32f2f;">${reservation.transaction_ref}</strong></p>
      <p><strong>Statut paiement:</strong> ${reservation.paiement_statut}</p>
      <p><strong>Demandes spéciales:</strong> ${reservation.demandes_speciales || 'Aucune'}</p>
      <br>
      <p><em>Connectez-vous au dashboard admin pour valider ou refuser ce paiement.</em></p>
      <a href="http://localhost:3000/admin" style="background: #1a3a6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accéder au Dashboard</a>
    `
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email de notification envoyé à l\'admin');
  } catch (error) {
    console.error('❌ Erreur envoi email admin:', error);
  }
}

// Mapping payload
function mapPayload(body = {}) {
  const fullName = body.fullName || `${body.nom || ''} ${body.prenom || ''}`.trim();
  const [nom, ...rest] = fullName.split(' ');
  const prenom = rest.join(' ') || (body.prenom || '');

  const prixTotal = body.totalPrice || body.prix_total || body.prix || 0;
  const acompte30 = Math.round(prixTotal * 0.30);
  const transactionRef = (body.transactionRef || body.transaction_ref || '').trim();

  return {
    nom: nom || body.nom || 'Inconnu',
    prenom: prenom || body.prenom || 'Inconnu',
    age: body.age || null,
    email: body.email || body.mail || null,
    telephone: body.phone || body.telephone || null,
    adresse: body.adresse || body.address || null,
    nb_personnes: body.participants || body.nb_personnes || 1,
    type_reservation: body.type || body.type_reservation || (body.destination ? 'activite' : 'voyage'),
    nom_item: body.destination || body.nom_item || null,
    prix_total: prixTotal,
    acompte_30pct: acompte30,
    mode_paiement: body.modePaiement || body.mode_paiement || 'BaridiMob',
    transaction_ref: transactionRef || null,
    paiement_statut: transactionRef ? 'attente_validation' : 'non_saisi',
    date_depart: body.startDate || body.date_depart || null,
    regimen: body.regimen || null,
    demandes_speciales: body.specialRequests || body.demandes_speciales || null,
    status: body.status === 'pending' ? 'en_attente' : (body.status || 'en_attente')
  };
}

// Créer réservation avec vérification date bloquée
exports.createReservation = async (req, res) => {
  try {
    const payload = mapPayload(req.body || {});

    // ⚠️ Vérifier si la date est bloquée pour cette activité
    if (payload.nom_item && payload.date_depart) {
      const blocked = await Blocked.findOne({
        where: { nom_item: payload.nom_item, date: payload.date_depart }
      });
      if (blocked) {
        return res.status(400).json({ error: "Cette date est déjà bloquée, impossible de réserver." });
      }
    }

    const reservation = await Reservation.create(payload);
    res.status(201).json(reservation);

    // ⚡ Notifier l'admin si paiement manuel avec numéro de transaction
    if (payload.transaction_ref) {
      notifyAdminNewReservation(reservation);
    }
  } catch (err) {
    console.error('createReservation error:', err);
    res.status(500).json({ error: 'Erreur création réservation' });
  }
};

// Récupérer toutes les réservations
exports.getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll({ order: [['createdAt', 'DESC']] });
    res.json(reservations);
  } catch (err) {
    console.error('getReservations error:', err);
    res.status(500).json({ error: 'Erreur récupération réservations' });
  }
};

// Accepter réservation
exports.acceptReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ error: "Réservation introuvable" });

    reservation.status = "acceptee";
    await reservation.save();

    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur acceptation" });
  }
};

// Refuser réservation
exports.refuseReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ error: "Réservation introuvable" });

    reservation.status = "refusee";
    await reservation.save();

    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur refus" });
  }
};

// Mettre à jour champs de réservation (paiement manuel)
exports.updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ error: "Réservation introuvable" });

    const allowed = ['paiement_statut', 'mode_paiement', 'transaction_ref', 'status'];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) {
        reservation[key] = req.body[key];
      }
    });

    await reservation.save();
    res.json(reservation);
  } catch (err) {
    console.error('updateReservation error:', err);
    res.status(500).json({ error: 'Erreur mise à jour réservation' });
  }
};
