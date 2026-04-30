require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const sequelize = require("./db");

const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");

const app = express();

// ============================
// MIDDLEWARE
// ============================
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use("/api/reservations", reservationRoutes);
app.use("/availability", availabilityRoutes);

// ============================
// MAIL CONFIG
// ============================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ============================
// EMAIL ROUTE
// ============================
app.post("/send-email", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    await transporter.sendMail({
      from: `"Visit Bejaia" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // 📩 toujours ton Gmail
      subject: "Nouveau message depuis VisitBejaia",
      html: `
        <h2>📩 Nouveau message VisitBejaia</h2>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${phone || "N/A"}</p>
        <hr>
        <p>${message}</p>
      `
    });

    return res.json({ success: true, message: "Email envoyé" });

  } catch (error) {
    console.error("Erreur email :", error);
    return res.status(500).json({ success: false, error: "Erreur email" });
  }
});

// ============================
// TEST ROUTE
// ============================
app.get("/", (req, res) => {
  res.send("Backend VisitBejaia OK");
});

// ============================
// START SERVER (SAFE)
// ============================
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("DB connectée");

    await sequelize.sync();
    console.log("Tables synchronisées");

    app.listen(PORT, () => {
      console.log("Serveur démarré sur port", PORT);
    });

  } catch (err) {
    console.error("Erreur startup:", err);
  }
}

startServer();
