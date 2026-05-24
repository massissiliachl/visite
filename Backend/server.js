require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");

const { sequelize } = require("./models");

// =========================
// ROUTES
// =========================
const adminRoutes = require("./routes/adminRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const propertyReservationRoutes = require("./routes/propertyReservationRoutes");
const authRoutes = require("./routes/authRoutes");
const emailRoutes = require("./routes/emailRoutes");
const ReservationAdminRoute = require("./routes/ReservationAdminRoute");

const app = express();

// =========================
// CONFIG EMAIL (GMAIL)
// =========================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000,
});

// Vérification SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Erreur SMTP :", error);
  } else {
    console.log("✅ SMTP prêt à envoyer des emails");
  }
});

// =========================
// MIDDLEWARES
// =========================
app.use(
  cors({
    origin: [
      "https://visitbejaia.org",
      "https://www.visitbejaia.org"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use(express.static(path.join(__dirname, "public")));

const clientDir = path.join(__dirname, "..", "Client");

// =========================
// LOG ENV
// =========================
console.log(
  "EMAIL_USER:",
  process.env.EMAIL_USER ? "Défini" : "MANQUANT"
);

console.log(
  "EMAIL_PASS:",
  process.env.EMAIL_PASS ? "Défini" : "MANQUANT"
);

// =========================
// ROUTES API
// =========================

// Réservations
app.use("/api/reservations", reservationRoutes);

// Disponibilités
app.use("/api/availability", availabilityRoutes);

// Réservations propriétés
app.use("/api/property-reservations", propertyReservationRoutes);

// Admin
app.use("/api/admin", adminRoutes);

// Auth
app.use("/api/auth", authRoutes);

// Réservations admin
console.log("✅ ROUTE ADMIN CHARGÉE");
app.use("/api/reservations-admin", ReservationAdminRoute);

// Emails
app.use("/", emailRoutes);

// Test API
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API OK",
  });
});

// =========================
// AVAILABILITY TEST
// =========================
app.get("/api/availability/:activityName", async (req, res) => {
  try {
    const activityName = decodeURIComponent(
      req.params.activityName
    );

    console.log("Activity :", activityName);

    res.json([]);
  } catch (error) {
    console.error("❌ Availability error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// =========================
// FRONTEND
// =========================
app.use(express.static(clientDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

// =========================
// 404 HANDLER
// =========================
app.use((req, res) => {
  if (
    req.path.startsWith("/api") ||
    req.path === "/send-email"
  ) {
    return res.status(404).json({
      success: false,
      error: "Route non trouvée",
      path: req.originalUrl,
    });
  }

  res.status(404).sendFile(
    path.join(clientDir, "index.html")
  );
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log("🔄 Connexion à la base de données...");

    await sequelize.authenticate();
    console.log("✅ Base de données connectée");

    await sequelize.sync({ alter: true });
    console.log("✅ Tables synchronisées");

    app.listen(PORT, () => {
      console.log(
        `🚀 Serveur démarré sur http://localhost:${PORT}`
      );
    });
  } catch (err) {
    console.error(
      "❌ ERREUR LORS DU DÉMARRAGE DU SERVEUR :",
      err
    );
  }
}

startServer();