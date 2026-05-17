require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const { sequelize } = require("./models");
const adminRoutes = require("./routes/adminRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const propertyReservationRoutes = require("./routes/propertyReservationRoutes");
const reservationAdminRoute = require("./routes/ReservationAdminRoute");

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES
app.use("/api/reservations", reservationRoutes);
app.use("/availability", availabilityRoutes);
app.use("/api/property-reservations", propertyReservationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reservation-admin", reservationAdminRoute);
app.get("/api/test", (req, res) => {
  res.json({ message: "API OK" });
});

// Vérifier les variables d'environnement
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "Défini" : "MANQUANT");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Défini" : "MANQUANT");

// Créer le transporteur email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// Vérifier la connexion email
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Erreur de connexion email:", error);
  } else {
    console.log("✅ Serveur email prêt");
  }
});

// Endpoint d'envoi d'email
app.post("/send-email", (req, res) => {
  res.json({
    success: true,
    message: "Email feature disabled"
  });
});
// Endpoint pour les dates bloquées (correction du template string)
app.get("/availability/:activityName", async (req, res) => {
  try {
    const activityName = decodeURIComponent(req.params.activityName);
    // Votre logique pour récupérer les dates bloquées
    res.json([]); // Exemple: retourner un tableau vide
  } catch (error) {
    console.error("Erreur availability:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log("🔄 Connexion à la base de données...");
    await sequelize.authenticate();
    console.log("✅ Base de données connectée");
    
    await sequelize.sync({ alter: true });
    console.log("✅ Tables synchronisées");
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📧 Endpoint email: http://localhost:${PORT}/send-email`);
    });
    
  } catch (err) {
    console.log("❌ Erreur au démarrage:", err);
  }
}

startServer();