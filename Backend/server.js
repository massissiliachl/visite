require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

// ✅ IMPORT CORRECT - plus de "./indexe"
const { sequelize, Reservation, Property, PropertyReservation } = require("./models");

const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const propertyReservationRoutes = require("./routes/propertyReservationRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use("/api/reservations", reservationRoutes);
app.use("/availability", availabilityRoutes);
app.use("/api/property-reservations", propertyReservationRoutes);

// MAIL
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// EMAIL ROUTE
app.post("/send-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: req.body.to,
      subject: req.body.subject,
      html: `
        <h2>Nouveau message VisitBejaia</h2>
        <p><strong>Nom :</strong> ${req.body.name || "N/A"}</p>
        <p><strong>Email :</strong> ${req.body.email || "N/A"}</p>
        <p><strong>Téléphone :</strong> ${req.body.phone || "N/A"}</p>
        <hr>
        <p>${req.body.message}</p>
      `
    });

    res.json({ message: "Email envoyé" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur email" });
  }
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connectée");

    await sequelize.sync({ alter: true });
    console.log("✅ Tables synchronisées");

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Erreur startup:", err);
  }
}

startServer();