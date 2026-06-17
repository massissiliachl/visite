const { ReservationAdmin } = require("../models");

function formatReservation(row) {
  const data = row?.toJSON ? row.toJSON() : { ...row };
  return {
    ...data,
    totalAPayer: parseFloat(data.totalAPayer) || 0,
    versement: parseFloat(data.versement) || 0,
    resteAPayer: parseFloat(data.resteAPayer) || 0,
    note: data.note?.trim() || "Aucune note"
  };
}

// ➕ Ajouter réservation
exports.createReservation = async (req, res) => {
  try {
    console.log("📦 BODY REÇU:", req.body);

    // Calcul automatique du reste à payer
    const totalAPayer = Number.isFinite(parseFloat(req.body.totalAPayer))
      ? parseFloat(req.body.totalAPayer)
      : 0;
    const versement = Number.isFinite(parseFloat(req.body.versement))
      ? parseFloat(req.body.versement)
      : 0;
    const resteAPayer = Math.max(0, totalAPayer - versement);

    if (totalAPayer <= 0) {
      return res.status(400).json({
        error: "Le total à payer doit être supérieur à 0 DA"
      });
    }

    if (versement > totalAPayer) {
      return res.status(400).json({
        error: "Le versement ne peut pas dépasser le total à payer"
      });
    }

    const reservation = await ReservationAdmin.create({
      nom: req.body.nom,
      prenom: req.body.prenom,
      tel: req.body.tel || "",
      activite: req.body.activite,
      heure: req.body.heure || "--:--",
      date: req.body.date,
      personnes: req.body.personnes || 1,
      
      // 🚤 BATEAU
      slot: req.body.slot || null,
      subslot: req.body.subslot || null,
      bateau: req.body.bateau || null,
      duree: req.body.duree || null,
      
      // 💰 PAIEMENT
      totalAPayer: totalAPayer,
      versement: versement,
      resteAPayer: resteAPayer,
      
      // 📝 NOTE
      note: req.body.note?.trim() || "Aucune note"
    });

    res.status(201).json(formatReservation(reservation));

  } catch (err) {
    console.error("❌ ERREUR CREATE:", err);
    res.status(500).json({
      error: err.message
    });
  }
};

// 📥 Récupérer toutes les réservations
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await ReservationAdmin.findAll({
      order: [['createdAt', 'DESC']]
    });
    console.log(`✅ ${reservations.length} réservations chargées`);
    res.json(reservations.map(formatReservation));
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
    
    // Si totalAPayer ou versement sont modifiés, recalculer automatiquement le reste
    const updateData = { ...req.body };
    
    if (req.body.totalAPayer !== undefined || req.body.versement !== undefined) {
      const parsedTotal = parseFloat(req.body.totalAPayer);
      const parsedVersement = parseFloat(req.body.versement);

      const total = Number.isFinite(parsedTotal)
        ? parsedTotal
        : (parseFloat(reservation.totalAPayer) || 0);

      const versement = Number.isFinite(parsedVersement)
        ? parsedVersement
        : (parseFloat(reservation.versement) || 0);

      updateData.resteAPayer = Math.max(0, total - versement);

      if (total <= 0) {
        return res.status(400).json({
          error: "Le total à payer doit être supérieur à 0 DA"
        });
      }

      if (versement > total) {
        return res.status(400).json({
          error: "Le versement ne peut pas dépasser le total à payer"
        });
      }
    }
    
    await reservation.update(updateData);
    console.log(`✅ Réservation ${req.params.id} mise à jour`);
    res.json(formatReservation(reservation));
  } catch (err) {
    console.error("❌ Erreur mise à jour:", err);
    res.status(500).json({ error: err.message });
  }
};

console.log("MODEL:", ReservationAdmin);