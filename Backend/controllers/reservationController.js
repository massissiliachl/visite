const Reservation = require('../models/Reservation');
const Blocked = require('../models/Blocked'); // ⚡ On ajoute la table des dates bloquées

// Mapping payload
function mapPayload(body = {}) {
  const fullName = body.fullName || `${body.nom || ''} ${body.prenom || ''}`.trim();
  const [nom, ...rest] = fullName.split(' ');
  const prenom = rest.join(' ') || (body.prenom || '');

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
    prix_total: body.totalPrice || body.prix_total || body.prix || 0,
    date_depart: body.startDate || body.date_depart || null,
    regimen: body.regimen || null,
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
