// controllers/propertyReservationController.js
const { PropertyReservation, Property } = require("../models");



/* =========================
   PHONE FORMAT
========================= */
function formatPhone(phone) {
  if (!phone) return null;

  phone = phone.replace(/\s/g, "");

  if (phone.startsWith("0")) {
    return "213" + phone.substring(1);
  }

  if (phone.startsWith("+")) {
    return phone.replace("+", "");
  }

  return phone;
}

/* =========================
   WHATSAPP MESSAGE
========================= */
function generateWhatsAppMessage(status) {
  switch (status) {
    case "acceptee":
      return "Bonjour 👋, c'est Visit Bejaia. Votre demande de réservation a été acceptée ✅.";
    case "refusee":
      return "Bonjour 👋, c'est Visit Bejaia. Votre demande de réservation a été refusée ❌.";
    default:
      return "";
  }
}

/* =========================
   WHATSAPP LINK
========================= */
function generateWhatsAppLink(phone, status) {
  const formattedPhone = formatPhone(phone);
  const message = generateWhatsAppMessage(status);

  if (!formattedPhone || !message) return null;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
// CREATE - Créer une réservation
exports.createReservation = async (req, res) => {
  try {
    console.log("DATA REÇUE :", req.body);
    
    const { 
      propertyId, 
      nom, 
      email, 
      date_arrivee, 
      date_depart, 
      nb_personnes,
      prenom,      // Optionnel
      telephone    // Optionnel
    } = req.body;
    
    const reservation = await PropertyReservation.create({
      propertyId,
      nom,
      prenom: prenom || null,     // Si non fourni, mettre null
      email,
      telephone: telephone || null, // Si non fourni, mettre null
      date_arrivee,
      date_depart,
      nb_personnes
    });
    
    res.status(201).json({
      success: true,
      message: "Réservation créée avec succès",
      data: reservation
    });
    
  } catch (error) {
    console.error("Erreur createReservation :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la réservation",
      error: error.message
    });
  }
};

// GET ALL - Récupérer toutes les réservations
exports.getAllReservations = async (req, res) => {
  try {
    const data = await PropertyReservation.findAll({
      include: [
        {
          model: Property,
          attributes: ['id', 'title', 'location', 'price', 'type'] // Sélectionnez les champs dont vous avez besoin
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: data
    });

  } catch (err) {
    console.error("Erreur getAllReservations :", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// GET BY ID - Récupérer une réservation spécifique
exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reservation = await PropertyReservation.findByPk(id, {
      include: [
        {
          model: Property,
          attributes: ['id', 'title', 'location', 'price', 'type', 'images']
        }
      ]
    });
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }
    
    res.json({
      success: true,
      data: reservation
    });
    
  } catch (err) {
    console.error("Erreur getReservationById :", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// controllers/propertyReservationController.js - Ajoutez cette fonction
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await PropertyReservation.findByPk(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }

    await reservation.update({ status });

    // 🔥 WhatsApp link
    const whatsappLink = generateWhatsAppLink(
      reservation.telephone,
      status
    );

    return res.json({
      success: true,
      message: "Statut mis à jour",
      whatsappLink
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// 🔥 METS CETTE FONCTION EN DEHORS (PAS DANS updateStatus)
function generateWhatsAppLink(phone, status) {
  const formattedPhone = formatPhone(phone);

  let message = "";

  if (status === "acceptee") {
    message = "Bonjour 👋, c'est Visit Bejaia. Votre demande de réservation a été acceptée ✅.";
  }

  if (status === "refusee") {
    message = "Bonjour 👋, c'est Visit Bejaia. Votre demande a été refusée ❌.";
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

function generateWhatsAppLink(phone, status) {
  const formattedPhone = formatPhone(phone);

  let message = "";

  if (status === "acceptee") {
    message = "Bonjour 👋, c'est Visit Bejaia. Votre demande de réservation a été acceptée ✅.";
  }

  if (status === "refusee") {
    message = "Bonjour 👋, c'est Visit Bejaia. Votre demande a été refusée ❌.";
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
// DELETE - Supprimer une réservation
exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reservation = await PropertyReservation.findByPk(id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }
    
    await reservation.destroy();
    
    res.json({
      success: true,
      message: "Réservation supprimée avec succès"
    });
    
  } catch (err) {
    console.error("Erreur deleteReservation :", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// GET BY PROPERTY - Récupérer les réservations d'une propriété
exports.getReservationsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    const reservations = await PropertyReservation.findAll({
      where: { propertyId: propertyId },
      include: [
        {
          model: Property,
          attributes: ['id', 'title', 'location']
        }
      ],
      order: [["date_arrivee", "ASC"]]
    });
    
    res.json({
      success: true,
      data: reservations
    });
    
  } catch (err) {
    console.error("Erreur getReservationsByProperty :", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};