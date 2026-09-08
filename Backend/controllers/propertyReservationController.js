// controllers/propertyReservationController.js
const { PropertyReservation, Property } = require("../models");
const { createMailTransporter } = require("../utils/mailer");

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
const ADMIN_WHATSAPP_NUMBER = "213660434872"; // numéro qui reçoit les demandes

const emailTransporter = createMailTransporter();

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

function generateAdminDemandWhatsAppLink(reservation) {
  const propertyName = reservation.Property?.title || reservation.propertyId || "Hébergement";
  const arrivee = formatDateFr(reservation.date_arrivee);
  const depart = formatDateFr(reservation.date_depart);
  const clientName = `${reservation.nom || ""} ${reservation.prenom || ""}`.trim() || "Client";
  const nb = reservation.nb_personnes || 1;

  const message = `📩 Nouvelle demande de réservation Visite Bejaia

Client : ${clientName}
Téléphone : ${reservation.telephone || "—"}
Email : ${reservation.email || "—"}
Hébergement : ${propertyName}
Du : ${arrivee}
Jusqu'au : ${depart}
Personnes : ${nb}
Prix : ${reservation.prix_total || 0} DZD`;

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

async function sendAdminNewReservationEmail(reservation, whatsappLink) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { sent: false, reason: "admin_email_manquant" };
  }

  const propertyName = reservation.Property?.title || reservation.propertyId || "Hébergement";
  const arrivee = formatDateFr(reservation.date_arrivee);
  const depart = formatDateFr(reservation.date_depart);
  const clientName = `${reservation.nom || ""} ${reservation.prenom || ""}`.trim();
  const hasWhatsApp = !!whatsappLink;

  const text = `Nouvelle demande de réservation hébergement

Client : ${clientName}
Téléphone : ${reservation.telephone || "—"}
Email : ${reservation.email || "—"}
Hébergement : ${propertyName}
Arrivée : ${arrivee}
Départ : ${depart}
Personnes : ${reservation.nb_personnes || 1}
Prix total : ${reservation.prix_total || 0} DZD
WhatsApp client : ${hasWhatsApp ? "Oui" : "Non — préférer WhatsApp si possible"}

${whatsappLink ? `Lien WhatsApp client : ${whatsappLink}` : "Pas de numéro WhatsApp valide — contacter par email."}`;

  const info = await emailTransporter.sendMail({
    from: `"Visit Béjaïa" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `Nouvelle réservation — ${propertyName} — ${clientName}`,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;">
        <div style="background:#1a3a6b;color:white;padding:20px;border-radius:10px 10px 0 0;">
          <h2 style="margin:0;">Nouvelle demande de réservation</h2>
        </div>
        <div style="background:#f5f5f5;padding:20px;border-radius:0 0 10px 10px;">
          <p><strong>Client :</strong> ${clientName}</p>
          <p><strong>Téléphone :</strong> ${reservation.telephone || "—"}</p>
          <p><strong>Email :</strong> ${reservation.email || "—"}</p>
          <p><strong>Hébergement :</strong> ${propertyName}</p>
          <p><strong>Dates :</strong> ${arrivee} → ${depart}</p>
          <p><strong>Personnes :</strong> ${reservation.nb_personnes || 1}</p>
          <p><strong>Prix :</strong> ${reservation.prix_total || 0} DZD</p>
          <p><strong>WhatsApp :</strong> ${hasWhatsApp ? "✅ Numéro valide" : "⚠️ Pas de WhatsApp — contacter par email"}</p>
          ${whatsappLink ? `<p><a href="${whatsappLink}" style="display:inline-block;background:#25d366;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;">Ouvrir WhatsApp client</a></p>` : ""}
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

    // Récupérer le prix de la propriété (devis = 0 temporairement)
    const isDevis = !!req.body.isDevis || Number(property.price) <= 0;
    let price = Number(property.price);
    if (isNaN(price) || price < 0) price = 0;
    if (!isDevis && price <= 0) {
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
      prix_total
    });

    const fullReservation = await PropertyReservation.findByPk(reservation.id, {
      include: [{ model: Property }]
    });

    const whatsappLink = generateWhatsAppLink(telephone, "en_attente", fullReservation);
    const adminWhatsAppLink = generateAdminDemandWhatsAppLink(fullReservation);
    const hasWhatsApp = !!whatsappLink;

    let clientEmailSent = false;
    let adminEmailSent = false;

    // Répondre immédiatement (les emails SMTP ne doivent pas bloquer l'utilisateur)
    res.status(201).json({
      success: true,
      data: fullReservation,
      whatsappLink,
      adminWhatsAppLink,
      hasWhatsApp,
      clientEmailSent,
      adminEmailSent,
      message: hasWhatsApp
        ? "Réservation créée avec succès"
        : "Réservation créée — nous vous contacterons par email (WhatsApp de préférence)"
    });

    setImmediate(async () => {
      if (!hasWhatsApp) {
        try {
          const emailResult = await sendReservationEmail(fullReservation, "en_attente");
          clientEmailSent = !!emailResult.sent;
        } catch (e) {
          console.error("Email client:", e.message);
        }
      }
      try {
        const adminResult = await sendAdminNewReservationEmail(fullReservation, whatsappLink);
        adminEmailSent = !!adminResult.sent;
      } catch (adminErr) {
        console.error("Erreur notification admin:", adminErr);
      }
      console.log("Reservation notifications async:", {
        id: reservation.id,
        hasWhatsApp,
        clientEmailSent,
        adminEmailSent
      });
    });

    return;

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
    const skipNotify = !!req.body.skipNotify;

    const whatsappLink = generateWhatsAppLink(
      reservation.telephone,
      newStatus,
      reservation
    );

    let emailSent = false;
    let emailError = null;

    // Envoi email seulement si pas de WhatsApp et pas déjà notifié côté admin
    if (!skipNotify && !whatsappLink) {
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

    // Statut mis à jour après notification (ou si skipNotify = déjà notifié côté client)
    await reservation.update({ status: newStatus });

    console.log(`📱 Statut mis à jour: ${oldStatus} → ${newStatus}`);
    console.log(`💰 Prix total: ${reservation.prix_total} DZD`);

    return res.json({
      success: true,
      message: "Statut mis à jour",
      whatsappLink: skipNotify ? null : whatsappLink,
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