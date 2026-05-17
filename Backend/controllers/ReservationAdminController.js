const { ReservationAdmin } = require("../models");

// ➕ Ajouter réservation
exports.createReservation = async (req, res) => {
  try {
    const reservation = await ReservationAdmin.create(req.body);
    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📥 récupérer toutes les réservations
exports.getAllReservations = async (req, res) => {
  try {
    const data = await ReservationAdmin.findAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ❌ supprimer
exports.deleteReservation = async (req, res) => {
  try {
    await ReservationAdmin.destroy({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✏️ modifier
exports.updateReservation = async (req, res) => {
  try {
    await ReservationAdmin.update(req.body, {
      where: { id: req.params.id }
    });
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};