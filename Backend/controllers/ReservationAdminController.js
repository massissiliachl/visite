const { ReservationAdmin } = require("../models");

function formatReservation(row) {
  const data = row?.toJSON ? row.toJSON() : { ...row };
  const total = parseFloat(data.totalAPayer ?? data.totalapayer) || 0;
  const versement = parseFloat(data.versement) || 0;
  const reste = data.resteAPayer != null || data.resteapayer != null
    ? (parseFloat(data.resteAPayer ?? data.resteapayer) || 0)
    : Math.max(0, total - versement);

  return {
    ...data,
    totalAPayer: total,
    versement,
    resteAPayer: reste,
    note: data.note?.trim() || "Aucune note"
  };
}

function buildPayload(body) {
  const totalAPayer = Number.isFinite(parseFloat(body.totalAPayer))
    ? parseFloat(body.totalAPayer)
    : (Number.isFinite(parseFloat(body.totalapayer)) ? parseFloat(body.totalapayer) : 0);
  const versement = Number.isFinite(parseFloat(body.versement))
    ? parseFloat(body.versement)
    : 0;
  const resteAPayer = Number.isFinite(parseFloat(body.resteAPayer))
    ? parseFloat(body.resteAPayer)
    : (Number.isFinite(parseFloat(body.resteapayer))
      ? parseFloat(body.resteapayer)
      : Math.max(0, totalAPayer - versement));

  return {
    nom: body.nom,
    prenom: body.prenom,
    tel: body.tel || null,
    activite: body.activite,
    heure: body.heure || null,
    date: body.date,
    personnes: parseInt(body.personnes, 10) || 1,
    slot: body.slot || null,
    subslot: body.subslot || null,
    bateau: body.bateau || null,
    duree: body.duree || null,
    totalapayer: totalAPayer,
    versement,
    resteapayer: resteAPayer,
    note: body.note?.trim() || "Aucune note"
  };
}

function validatePayment(payload) {
  const total = parseFloat(payload.totalapayer) || 0;
  const vers = parseFloat(payload.versement) || 0;
  if (total <= 0) {
    return "Le total à payer doit être supérieur à 0 DA";
  }
  if (vers > total) {
    return "Le versement ne peut pas dépasser le total à payer";
  }
  return null;
}

exports.createReservationAdmin = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const paymentError = validatePayment(payload);
    if (paymentError) {
      return res.status(400).json({ message: paymentError });
    }

    const reservation = await ReservationAdmin.create(payload);
    res.status(201).json(formatReservation(reservation));
  } catch (error) {
    console.error("createReservationAdmin:", error);
    res.status(500).json({
      message: "Erreur création réservation",
      error: error.message
    });
  }
};

exports.getReservationsAdmin = async (req, res) => {
  try {
    const reservations = await ReservationAdmin.findAll({
      order: [["date", "ASC"], ["heure", "ASC"]]
    });
    res.json(reservations.map(formatReservation));
  } catch (error) {
    res.status(500).json({
      message: "Erreur récupération",
      error: error.message
    });
  }
};

exports.getReservationAdminById = async (req, res) => {
  try {
    const reservation = await ReservationAdmin.findByPk(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    res.json(formatReservation(reservation));
  } catch (error) {
    res.status(500).json({
      message: "Erreur",
      error: error.message
    });
  }
};

exports.updateReservationAdmin = async (req, res) => {
  try {
    const reservation = await ReservationAdmin.findByPk(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }

    const payload = buildPayload({ ...reservation.toJSON(), ...req.body });
    const paymentError = validatePayment(payload);
    if (paymentError) {
      return res.status(400).json({ message: paymentError });
    }

    await reservation.update(payload);
    res.json(formatReservation(reservation));
  } catch (error) {
    res.status(500).json({
      message: "Erreur modification",
      error: error.message
    });
  }
};

exports.deleteReservationAdmin = async (req, res) => {
  try {
    const reservation = await ReservationAdmin.findByPk(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }

    await reservation.destroy();
    res.json({ message: "Réservation supprimée" });
  } catch (error) {
    res.status(500).json({
      message: "Erreur suppression",
      error: error.message
    });
  }
};
