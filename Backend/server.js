const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const sequelize = require('./db');

require("dotenv").config();

const reservationRoutes = require('./routes/reservationRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');

const app = express();

// ============================
// CORS CONFIGURATION (IMPORTANT)
// ============================
app.use(cors({
  origin: "https://visite-jnpc.onrender.com", // ← METS ICI L'URL DE TON FRONTEND
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ============================
// ROUTES
// ============================
app.use('/reservations', reservationRoutes);
app.use('/availability', availabilityRoutes);

// ============================
// MAIL CONFIG
// ============================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ============================
// ROUTE EMAIL
// ============================
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
<h3>Message :</h3>
<p>${req.body.message}</p>
`
        });

        res.json({ message: "Email envoyé" });

    } catch (error) {
        console.error("Erreur email :", error);
        res.status(500).json({ error: "Erreur email" });
    }
});

// ============================
// TEST SERVER
// ============================
app.get("/", (req, res) => res.send("Backend VisitBejaia OK"));

// ============================
// START SERVER
// ============================
const PORT = process.env.PORT || 3000;

sequelize.sync()
    .then(() => {
        console.log("Tables synchronisées");

        app.listen(PORT, () => {
            console.log("Serveur démarré sur port", PORT);
        });

    })
    .catch(err => console.error("Erreur Sequelize:", err));