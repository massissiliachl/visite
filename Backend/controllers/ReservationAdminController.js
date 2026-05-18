const { ReservationAdmin } = require("../models");

// ➕ Ajouter réservation
exports.createReservation = async (req, res) => {
  try {
    console.log("📝 Données reçues:", req.body);
    
    // Assurez-vous que toutes les données sont bien reçues
    const reservation = await ReservationAdmin.create({
      nom: req.body.nom,
      prenom: req.body.prenom,
      tel: req.body.tel || "",
      activite: req.body.activite,
      heure: req.body.heure || "--:--",
      date: req.body.date,
      personnes: req.body.personnes || 1  // 🔥 AJOUTEZ CETTE LIGNE
    });
    
    res.status(201).json(reservation);
  } catch (err) {
    console.error("❌ Erreur création:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📥 Récupérer toutes les réservations
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await ReservationAdmin.findAll({
      order: [['createdAt', 'DESC']]
    });
    console.log(`✅ ${reservations.length} réservations chargées`);
    res.json(reservations);
  } catch (err) {
    console.error("❌ Erreur chargement:", err);
    res.status(500).json({ error: err.message });
  }
};

// ❌ Supprimer une réservation
exports.deleteReservation = async (req, res) => {
  try {
    const deleted = await ReservationAdmin.destroy({
      where: { id: req.params.id }
    });
    
    if (deleted) {
      console.log(`✅ Réservation ${req.params.id} supprimée`);
      res.json({ message: "Réservation supprimée" });
    } else {
      res.status(404).json({ error: "Réservation non trouvée" });
    }
  } catch (err) {
    console.error("❌ Erreur suppression:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✏️ Modifier une réservation
exports.updateReservation = async (req, res) => {
  try {
    const reservation = await ReservationAdmin.findByPk(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }
    
    await reservation.update(req.body);
    console.log(`✅ Réservation ${req.params.id} mise à jour`);
    res.json(reservation);
  } catch (err) {
    console.error("❌ Erreur mise à jour:", err);
    res.status(500).json({ error: err.message });
  }
};