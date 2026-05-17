const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Vérifier la connexion au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Erreur de connexion email:", error);
  } else {
    console.log("✅ Serveur email prêt à envoyer des messages");
  }
});

// Endpoint pour envoyer des emails
router.post("/send-email", async (req, res) => {
  console.log("📧 Requête reçue sur /send-email");
  console.log("Body:", req.body);
  
  try {
    const { to, subject, message } = req.body;
    
    // Validation
    if (!to || !subject || !message) {
      return res.status(400).json({ 
        error: "Champs manquants. Requiert: to, subject, message" 
      });
    }
    
    // Configuration de l'email
    const mailOptions = {
      from: `"Visit Béjaïa" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a3a6b, #d32f2f); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Visit Béjaïa</h2>
            </div>
            <div class="content">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement depuis le formulaire de contact.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé avec succès:", info.messageId);
    
    res.json({ 
      success: true, 
      message: "Email envoyé avec succès",
      messageId: info.messageId 
    });
    
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi:", error);
    res.status(500).json({ 
      error: "Erreur lors de l'envoi de l'email",
      details: error.message 
    });
  }
});

// Endpoint de test
router.get("/email-test", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Email routes are working",
    email_user: process.env.EMAIL_USER ? "Défini" : "Non défini"
  });
});

module.exports = router;