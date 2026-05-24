require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const { sequelize } = require("./models");

// ROUTES
const adminRoutes = require("./routes/adminRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const propertyReservationRoutes = require("./routes/propertyReservationRoutes");
const authRoutes = require("./routes/authRoutes");
const emailRoutes = require("./routes/emailRoutes");

const ReservationAdminRoute = require("./routes/ReservationAdminRoute");
const app = express();
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  },
  // ⬇️ AJOUTE CES OPTIONS ⬇️
  tls: {
      rejectUnauthorized: false
  },
  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000,
  debug: true,
  logger: true
});

/* =========================
   MIDDLEWARES
========================= */
app.use(cors({
  origin: "*"
}));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use(express.static(path.join(__dirname, "public")));

const clientDir = path.join(__dirname, "..", "Client");

/* =========================
   ROUTES API
========================= */

// IMPORTANT : cohérence avec frontend
app.use("/api/reservations", reservationRoutes);

app.use("/api/availability", availabilityRoutes);

app.use("/api/property-reservations", propertyReservationRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/auth", authRoutes);
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
app.use("/", emailRoutes);

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
   FRONTEND (Client)
========================= */
app.use(express.static(clientDir));
app.get("/", (req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

/* =========================
   404 HANDLER (IMPORTANT DEBUG)
========================= */
app.use((req, res) => {
  if (req.path.startsWith("/api") || req.path === "/send-email") {
    return res.status(404).json({
      error: "Route non trouvée",
      path: req.originalUrl
    });
  }
  res.status(404).sendFile(path.join(clientDir, "index.html"));
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