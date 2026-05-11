require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const { sequelize } = require("./models");

const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const propertyReservationRoutes = require("./routes/propertyReservationRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// ROUTES
app.use("/api/reservations", reservationRoutes);
app.use("/availability", availabilityRoutes);
app.use("/api/property-reservations", propertyReservationRoutes);

// TEST ROUTE (IMPORTANT)
app.get("/api/test", (req, res) => {
  res.json({ message: "API OK" });
});

// EMAIL
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post("/send-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: req.body.to,
      subject: req.body.subject,
      html: `
        <h2>Message VisitBejaia</h2>
        <p>${req.body.message}</p>
      `
    });

    res.json({ message: "Email envoyé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

// START SERVER (UNE SEULE FOIS)
async function startServer() {
  try {
    console.log("DB connection...");

    await sequelize.authenticate();
    console.log("DB OK");

    await sequelize.sync();

    app.listen(PORT, () => {
      console.log("Server started on port", PORT);
    });

  } catch (err) {
    console.log("ERROR START:", err);
  }
}

startServer();