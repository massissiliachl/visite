const Reservation = require('../models/Reservation');

// ➤ CREATE reservation

exports.createReservation = async (req, res) => {
  try {
    const data = req.body;
    
    // LOG DÉTAILLÉ DE CE QUI EST REÇU
    console.log("=== REQUÊTE REÇUE ===");
    console.log("Corps complet:", JSON.stringify(data, null, 2));
    console.log("Nom reçu:", data.nom);
    console.log("Prénom reçu:", data.prenom);
    console.log("Téléphone:", data.telephone);
    console.log("Email:", data.email);
    console.log("Date départ:", data.date_depart);

    // Validation plus permissive
    if (!data.nom || !data.prenom) {
      console.error("Erreur: nom ou prénom manquant");
      return res.status(400).json({
        message: "Nom et prénom sont obligatoires",
        received: { nom: data.nom, prenom: data.prenom }
      });
    }
    
    if (!data.telephone) {
      console.error("Erreur: téléphone manquant");
      return res.status(400).json({
        message: "Le téléphone est obligatoire"
      });
    }
    
    if (!data.date_depart) {
      console.error("Erreur: date départ manquante");
      return res.status(400).json({
        message: "La date de départ est obligatoire"
      });
    }

    // Nettoyer les données (enlever les espaces inutiles)
    const cleanData = {
      nom: data.nom.trim(),
      prenom: data.prenom.trim(),
      email: data.email ? data.email.trim() : null,
      telephone: data.telephone.trim(),
      adresse: data.adresse || null,
      nb_personnes: parseInt(data.nb_personnes) || 1,
      type_reservation: data.type_reservation || "activite",
      nom_item: data.nom_item || null,
      prix_total: parseFloat(data.prix_total) || 0,
      acompte_30pct: parseFloat(data.acompte_30pct) || 0,
      date_depart: data.date_depart,
      status: data.status || "en_attente",
      mode_paiement: data.mode_paiement || "BaridiMob",
      transaction_ref: data.transaction_ref || null,
      paiement_statut: data.paiement_statut || "non_saisi",
      demandes_speciales: data.demandes_speciales || null
    };

    console.log("Données nettoyées:", cleanData);

    const reservation = await Reservation.create(cleanData);
    
    console.log("✅ Réservation créée avec ID:", reservation.id);
    
    return res.status(201).json({
      message: "Réservation créée avec succès",
      data: reservation
    });

  } catch (error) {
    console.error("=== ERREUR DÉTAILLÉE ===");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Name:", error.name);
    
    // Afficher l'erreur complète de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }));
      console.error("Erreurs de validation:", errors);
      return res.status(400).json({
        message: "Erreur de validation des données",
        errors: errors
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      console.error("Erreur base de données:", error.original);
      return res.status(500).json({
        message: "Erreur base de données",
        error: error.message,
        sqlMessage: error.original?.message
      });
    }
    
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
      type: error.name
    });
  }
};

// ➤ GET all reservations (admin)
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};



// ➤ GET one reservation
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Introuvable" });
    }

    res.json(reservation);

  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};



// ➤ UPDATE status (validation paiement / admin)
exports.updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Introuvable" });
    }

    await reservation.update(req.body);

    res.json({
      message: "Réservation mise à jour",
      data: reservation
    });

  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};



// ➤ DELETE reservation
exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Introuvable" });
    }

    await reservation.destroy();

    res.json({
      message: "Réservation supprimée"
    });

  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};