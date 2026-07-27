// controllers/propertyReservationController.js
const { PropertyReservation, Property } = require("../models");
const nodemailer = require("nodemailer");

/* =========================
   PHONE FORMAT
========================= */
function formatPhone(phone) {
  if (!phone) return null;
  phone = String(phone).replace(/[\s.\-()]/g, "");
  if (phone.startsWith("0")) {
    return "213" + phone.substring(1);
  }
  if (phone.startsWith("+")) {
    return phone.replace("+", "");
  }
  return phone;
}

function isValidWhatsAppPhone(phone) {
  const formatted = formatPhone(phone);
  if (!formatted) return false;
  // Numéro international : 8 à 15 chiffres
  return /^[1-9]\d{7,14}$/.test(formatted);
}

const BUSINESS_WHATSAPP_DISPLAY = "+213 660 43 48 72";

const emailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false }
});

/* =========================
   MESSAGE CLIENT
========================= */
function formatDateFr(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function generateClientMessage(status, reservation) {
  const nom = `${reservation.nom || ""} ${reservation.prenom || ""}`.trim();
  const propertyName = reservation.Property?.title || "votre hébergement";
  const arrivee = formatDateFr(reservation.date_arrivee);
  const depart = formatDateFr(reservation.date_depart);
  const nb = reservation.nb_personnes || 1;

  if (status === "acceptee" || status === "en_attente") {
    const greeting = nom ? `Bonjour ${nom},\n\n` : "Bonjour,\n\n";
    return `${greeting}c'est Visite Bejaia.\n\nNous avons reçu votre demande de réservation de ${propertyName} du ${arrivee} jusqu'au ${depart} pour ${nb} personne${nb > 1 ? "s" : ""}.`;
  }
  if (status === "refusee") {
    return `Bonjour${nom ? ` ${nom}` : ""},

c'est Visite Bejaia.

Nous sommes désolés, votre demande de réservation pour ${propertyName} du ${arrivee} jusqu'au ${depart} n'a pas pu être acceptée.

Pour d'autres disponibilités, contactez-nous au ${BUSINESS_WHATSAPP_DISPLAY}.`;
  }
  return "";
}

/* =========================
   WHATSAPP LINK
========================= */
function generateWhatsAppLink(phone, status, reservation) {
  if (!isValidWhatsAppPhone(phone)) return null;
  const formattedPhone = formatPhone(phone);
  const message = generateClientMessage(status, reservation);
  if (!formattedPhone || !message) return null;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/* =========================
   EMAIL FALLBACK
========================= */
async function sendReservationEmail(reservation, status) {
  const to = reservation.email;
  if (!to || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { sent: false, reason: "email_ou_config_manquant" };
  }

  const message = generateClientMessage(status, reservation);
  if (!message) return { sent: false, reason: "message_vide" };

  const subject =
    status === "refusee"
      ? "Visite Bejaia — Votre demande de réservation"
      : "Visite Bejaia — Confirmation de réception de votre demande";

  const info = await emailTransporter.sendMail({
    from: `"Visit Béjaïa" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: message,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#1a3a6b,#d32f2f);color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0;">
          <h2 style="margin:0;">Visit Béjaïa</h2>
        </div>
        <div style="background:#f5f5f5;padding:20px;border-radius:0 0 10px 10px;">
          ${message.replace(/\n/g, "<br>")}
          <p style="margin-top:24px;">WhatsApp : ${BUSINESS_WHATSAPP_DISPLAY}</p>
        </div>
      </div>
    `
  });

  return { sent: true, messageId: info.messageId };
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
    const newStatus = req.body.status;
    await reservation.update({ status: newStatus });

    const whatsappLink = generateWhatsAppLink(
      reservation.telephone,
      newStatus,
      reservation
    );

    let emailSent = false;
    let emailError = null;

    // Si le numéro WhatsApp est invalide/absent → envoi par email
    if (!whatsappLink) {
      try {
        const emailResult = await sendReservationEmail(reservation, newStatus);
        emailSent = !!emailResult.sent;
        if (!emailSent) emailError = emailResult.reason || "echec_envoi";
        console.log(emailSent ? `📧 Email envoyé à ${reservation.email}` : `⚠️ Email non envoyé: ${emailError}`);
      } catch (mailErr) {
        emailError = mailErr.message;
        console.error("❌ Erreur envoi email fallback:", mailErr);
      }
    }

    console.log(`📱 Statut mis à jour: ${oldStatus} → ${newStatus}`);
    console.log(`💰 Prix total: ${reservation.prix_total} DZD`);

    return res.json({
      success: true,
      message: "Statut mis à jour",
      whatsappLink,
      emailSent,
      emailError,
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