const { ReservationAdmin } = require("../models");

function formatReservation(row) {
  const data = row?.toJSON ? row.toJSON() : { ...row };
  
  console.log("🔍 Formatage de la réservation ID:", data.id);
  console.log("📦 Données brutes du modèle:", data);
  
  // Récupérer toutes les valeurs avec des valeurs par défaut
  const result = {
    id: data.id,
    nom: data.nom || "",
    prenom: data.prenom || "",
    tel: data.tel || "",
    activite: data.activite || "",
    heure: data.heure || "--:--",
    date: data.date || new Date().toISOString().split('T')[0],
    personnes: data.personnes || 1,
    
    // Champs bateau
    slot: data.slot || null,
    subslot: data.subslot || null,
    bateau: data.bateau || null,
    duree: data.duree || null,
    
    // 💰 CHAMPS PAIEMENT - IMPORTANT !
    totalAPayer: parseFloat(data.totalAPayer) || 0,
    versement: parseFloat(data.versement) || 0,
    resteAPayer: parseFloat(data.resteAPayer) || 0,
    
    // 📝 NOTE
    note: (data.note && String(data.note).trim()) ? data.note.trim() : "Aucune note",
    
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
  
  console.log("✅ Résultat formaté:", {
    id: result.id,
    nom: result.nom,
    totalAPayer: result.totalAPayer,
    versement: result.versement,
    resteAPayer: result.resteAPayer,
    note: result.note
  });
  
  return result;
}

// 📥 Récupérer toutes les réservations
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await ReservationAdmin.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`✅ ${reservations.length} réservations chargées`);
    
    // Log pour déboguer la première réservation
    if (reservations.length > 0) {
      console.log("📊 Première réservation brute:", reservations[0].toJSON());
    }
    
    const formatted = reservations.map(formatReservation);
    console.log("📊 Première réservation formatée:", formatted[0]);
    
    res.json(formatted);
  } catch (err) {
    console.error("❌ Erreur chargement:", err);
    res.status(500).json({ error: err.message });
  }
};

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

    // Validation
    if (!req.body.nom || !req.body.prenom) {
      return res.status(400).json({
        error: "Le nom et le prénom sont obligatoires"
      });
    }

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

    // Créer la réservation avec tous les champs
    const reservation = await ReservationAdmin.create({
      nom: req.body.nom.trim(),
      prenom: req.body.prenom.trim(),
      tel: req.body.tel || "",
      activite: req.body.activite || "Visite guidée",
      heure: req.body.heure || "--:--",
      date: req.body.date || new Date().toISOString().split('T')[0],
      personnes: parseInt(req.body.personnes) || 1,
      
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

    console.log("✅ Réservation créée avec ID:", reservation.id);
    console.log("📊 Réservation créée:", reservation.toJSON());
    
    res.status(201).json(formatReservation(reservation));

  } catch (err) {
    console.error("❌ ERREUR CREATE:", err);
    res.status(500).json({
      error: err.message || "Erreur lors de la création de la réservation"
    });
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

// ❌ Supprimer une réservation
exports.deleteReservation = async (req, res) => {
  try {
    const deleted = await ReservationAdmin.destroy({
      where: { id: req.params.id }
    });
    
    if (deleted) {
      console.log(`✅ Réservation ${req.params.id} supprimée`);
      res.json({ message: "Réservation supprimée avec succès" });
    } else {
      res.status(404).json({ error: "Réservation non trouvée" });
    }
  } catch (err) {
    console.error("❌ Erreur suppression:", err);
    res.status(500).json({ error: err.message });
  }
};

console.log("✅ Contrôleur ReservationAdmin chargé avec succès");