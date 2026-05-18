require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const { sequelize } = require("./models");

// ROUTES
const adminRoutes = require("./routes/adminRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const propertyReservationRoutes = require("./routes/propertyReservationRoutes");

// ⚠️ CORRECTION IMPORT (important)
const ReservationAdminRoute = require("./routes/ReservationAdminRoute");
const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(cors({
  origin: "*"
}));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   ROUTES API
========================= */

// IMPORTANT : cohérence avec frontend
app.use("/api/reservations", reservationRoutes);

app.use("/api/availability", availabilityRoutes);

app.use("/api/property-reservations", propertyReservationRoutes);

app.use("/api/admin", adminRoutes);

// 🔥 CORRECTION IMPORTANTE ICI
console.log("ROUTE ADMIN CHARGÉE");
app.use("/api/reservations-admin", ReservationAdminRoute);
// test API
app.get("/api/test", (req, res) => {
  res.json({ message: "API OK" });
});

/* =========================
   EMAIL (GMAIL)
========================= */

console.log("EMAIL_USER:", process.env.EMAIL_USER ? "Défini" : "MANQUANT");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Défini" : "MANQUANT");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ Erreur email:", error);
  } else {
    console.log("✅ Serveur email prêt");
  }
});

/* =========================
   EMAIL ENDPOINT (désactivé)
========================= */
app.post("/send-email", (req, res) => {
  res.json({
    success: true,
    message: "Email feature disabled"
  });
});

/* =========================
   AVAILABILITY
========================= */
app.get("/api/availability/:activityName", async (req, res) => {
  try {
    const activityName = decodeURIComponent(req.params.activityName);

    res.json([]);
  } catch (error) {
    console.error("❌ Availability error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   404 HANDLER (IMPORTANT DEBUG)
========================= */
app.use((req, res) => {
  res.status(404).json({
    error: "Route non trouvée",
    path: req.originalUrl
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log("🔄 Connexion DB...");

    await sequelize.authenticate();
    console.log("✅ DB connectée");

    await sequelize.sync({ alter: true });
    console.log("✅ Tables sync");

    app.listen(PORT, () => {
      console.log(`🚀 Serveur sur port ${PORT}`);
    });

  } catch (err) {
    console.log("❌ ERREUR START SERVER:", err);
  }
}

startServer();