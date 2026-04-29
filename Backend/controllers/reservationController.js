const Reservation = require('../models/Reservation');
const Blocked = require('../models/Blocked');

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

    const modePaiement = (data.mode_paiement || "").trim();
    const requiresProof = modePaiement === "BaridiMob" || modePaiement === "CCP";
    if (requiresProof && !data.payment_proof) {
      return res.status(400).json({
        message: "La preuve de paiement (capture/scanner) est obligatoire pour BaridiMob/CCP"
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
      mode_paiement: modePaiement || "BaridiMob",
      transaction_ref: data.transaction_ref || null,
      paiement_statut: data.paiement_statut || "non_saisi",
      demandes_speciales: data.demandes_speciales || null,
      payment_proof: data.payment_proof || null
    };

    console.log("Données nettoyées:", cleanData);

    // Vérifier si la date est bloquée pour cette activité
    if (cleanData.nom_item && cleanData.date_depart) {
      const blocked = await Blocked.findOne({
        where: {
          nom_item: cleanData.nom_item,
          date: cleanData.date_depart
        }
      });
      if (blocked) {
        return res.status(400).json({
          message: `La date ${cleanData.date_depart} est bloquée pour l'activité ${cleanData.nom_item}. Veuillez choisir une autre date.`
        });
      }
    }

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

// ➤ UPDATE status acceptee/refusee (admin)
exports.updateReservationStatus = async (req, res) => {
  try {
    console.log("=== UPDATE STATUS ADMIN ===", {
      id: req.params.id,
      status: req.body?.status
    });

    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Introuvable" });
    }

    const { status } = req.body;
    if (!['acceptee', 'refusee', 'en_attente'].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    let paiement_statut = reservation.paiement_statut;
    if (status === 'acceptee') {
      paiement_statut = 'valide';
    } else if (status === 'refusee') {
      paiement_statut = 'refuse';
    } else if (status === 'en_attente') {
      paiement_statut = reservation.transaction_ref ? 'attente_validation' : 'non_saisi';
    }

    await reservation.update({ status, paiement_statut });

    res.json({
      message: "Statut de réservation mis à jour",
      data: {
        id: reservation.id,
        status: reservation.status,
        paiement_statut: reservation.paiement_statut,
        updatedAt: reservation.updatedAt
      }
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
