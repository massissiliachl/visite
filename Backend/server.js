require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const dns = require("dns");

const SibApiV3Sdk = require("sib-api-v3-sdk");

const { sequelize } = require("./models");

const adminRoutes = require("./routes/adminRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const propertyReservationRoutes = require("./routes/propertyReservationRoutes");
const reservationAdminRoute = require("./routes/ReservationAdminRoute");

const app = express();

/* =========================
   DNS FIX (Render / IPv4)
========================= */
dns.setDefaultResultOrder("ipv4first");

/* =========================
   MIDDLEWARE
========================= */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   ROUTES
========================= */
app.use("/api/reservations", reservationRoutes);
app.use("/availability", availabilityRoutes);
app.use("/api/property-reservations", propertyReservationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reservation-admin", reservationAdminRoute);

app.get("/api/test", (req, res) => {
  res.json({ message: "API OK" });
});

/* =========================
   BREVO EMAIL
========================= */
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing fields",
      });
    }

    const result = await emailApi.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_USER || "visitebejaia@gmail.com",
        name: "Visit Béjaïa",
      },
      to: [{ email: to }],
      subject,
      htmlContent: `
        <div style="font-family: Arial; padding:15px;">
          <h2>Visit Béjaïa</h2>
          <p>${message.replace(/\n/g, "<br>")}</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Email envoyé",
      id: result.messageId || null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* =========================
   AVAILABILITY
========================= */
app.get("/availability/:activityName", async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📧 /send-email ready`);
    });
  } catch (err) {
    console.error("❌ Server error:", err);
  }
}

startServer();