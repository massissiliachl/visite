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
function generateWhatsAppMessage(status, reservation) {
  if (status === "acceptee") {
    return `Bonjour 👋, c'est Visit Bejaia. Votre réservation pour ${reservation.nom} ${reservation.prenom} a été acceptée ✅. Montant total: ${reservation.prix_total} DZD.`;
  }
  if (status === "refusee") {
    return `Bonjour 👋, c'est Visit Bejaia. Votre réservation pour ${reservation.nom} ${reservation.prenom} a été refusée ❌.`;
  }
  return "";
}

/* =========================
   WHATSAPP LINK
========================= */
function generateWhatsAppLink(phone, status, reservation) {
  const formattedPhone = formatPhone(phone);
  const message = generateWhatsAppMessage(status, reservation);
  if (!formattedPhone || !message) return null;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/* =========================
   CREATE RESERVATION - CORRIGÉ
========================= */
exports.createReservation = async (req, res) => {
  try {
    const {
      propertyId,
      nom,
      email,
      date_arrivee,
      date_depart,
      nb_personnes,
      prenom,
      telephone
    } = req.body;

    console.log("🔍 Recherche propriété avec ID:", propertyId);

    // RECHERCHE CORRIGÉE - propertyId est une string
    const property = await Property.findByPk(propertyId.toString());

    if (!property) {
      console.error("❌ Propriété non trouvée pour ID:", propertyId);
      return res.status(404).json({
        success: false,
        message: `Propriété introuvable avec l'ID: ${propertyId}`
      });
    }

    console.log("✅ Propriété trouvée:", {
      id: property.id,
      title: property.title,
      price: property.price,
      priceType: typeof property.price
    });

    // Récupérer le prix de la propriété
    const price = Number(property.price);
    
    if (isNaN(price) || price <= 0) {
      console.error("❌ Prix invalide:", property.price);
      return res.status(400).json({
        success: false,
        message: "Prix de la propriété invalide"
      });
    }

    // Calculer le nombre de nuits
    const startDate = new Date(date_arrivee);
    const endDate = new Date(date_depart);
    const nights = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

    console.log("📅 Calcul:", { startDate, endDate, nights });

    if (nights < 3) {
      return res.status(400).json({
        success: false,
        message: "Minimum 3 nuits de réservation"
      });
    }

    // Calculer le prix total
    const prix_total = price * nights;

    console.log("💰 Calcul prix:", {
      price,
      nights,
      prix_total
    });

    // Créer la réservation avec le prix total
    const reservation = await PropertyReservation.create({
      propertyId: propertyId.toString(),
      nom,
      prenom: prenom || null,
      email,
      telephone: telephone || null,
      date_arrivee,
      date_depart,
      nb_personnes,
      prix_total  // ✅ Maintenant correctement calculé
    });

    console.log("✅ Réservation créée:", {
      id: reservation.id,
      prix_total: reservation.prix_total
    });

    return res.status(201).json({
      success: true,
      data: reservation,
      message: "Réservation créée avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur createReservation:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/* =========================
   GET ALL
========================= */
exports.getAllReservations = async (req, res) => {
  try {
    const data = await PropertyReservation.findAll({
      include: [{ model: Property }],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data });

  } catch (err) {
    console.error("Erreur getAllReservations :", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* =========================
   GET BY ID
========================= */
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await PropertyReservation.findByPk(req.params.id, {
      include: [{ model: Property }]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }

    res.json({ success: true, data: reservation });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* =========================
   UPDATE STATUS - CORRIGÉ (ajout du prix dans le message)
========================= */
exports.updateStatus = async (req, res) => {
  try {
    const reservation = await PropertyReservation.findByPk(req.params.id, {
      include: [{ model: Property }]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }

    const oldStatus = reservation.status;
    await reservation.update({ status: req.body.status });

    // Générer le lien WhatsApp avec le prix total
    const whatsappLink = generateWhatsAppLink(
      reservation.telephone,
      req.body.status,
      reservation
    );

    console.log(`📱 Statut mis à jour: ${oldStatus} → ${req.body.status}`);
    console.log(`💰 Prix total: ${reservation.prix_total} DZD`);

    return res.json({
      success: true,
      message: "Statut mis à jour",
      whatsappLink,
      data: reservation
    });

  } catch (err) {
    console.error("Erreur updateStatus:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* =========================
   DELETE
========================= */
exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await PropertyReservation.findByPk(req.params.id);

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
    res.status(500).json({ success: false, error: err.message });
  }
};

/* =========================
   BY PROPERTY
========================= */
exports.getReservationsByProperty = async (req, res) => {
  try {
    const reservations = await PropertyReservation.findAll({
      where: { propertyId: req.params.propertyId },
      include: [{ model: Property }],
      order: [["date_arrivee", "ASC"]]
    });

    res.json({ success: true, data: reservations });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};