require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { sequelize } = require("./models");
const { ensurePropertyColumns } = require("./utils/ensurePropertyColumns");
const { ensureReservationAdminColumns } = require("./utils/ensureReservationAdminColumns");

// ROUTES
const adminRoutes = require("./routes/adminRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const propertyReservationRoutes = require("./routes/propertyReservationRoutes");
const authRoutes = require("./routes/authRoutes");
const emailRoutes = require("./routes/emailRoutes");
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

const clientDir = path.join(__dirname, "..", "Client");

/* =========================
   CONFIGURATION MULTER (UPLOAD DANS assets/images/properties)
========================= */
// Dossier où seront stockées les images uploadées par l'admin
const uploadDir = path.join(clientDir, "assets", "images", "properties");

// Créer le dossier s'il n'existe pas (seulement si besoin)
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Dossier créé: ${uploadDir}`);
}

// Configuration du stockage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Seules les images (JPEG, PNG, WEBP) sont autorisées'));
    }
};

// Middleware multer
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: fileFilter
});

// Middleware d'authentification pour l'upload
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token manquant ou invalide" });
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.email !== "admin@visitbejaia.com") {
            return res.status(403).json({ error: "Accès non autorisé" });
        }
        
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Token invalide ou expiré" });
    }
};

/* =========================
   ROUTES API
========================= */

// Route d'upload d'images
app.post("/api/upload", auth, upload.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Aucun fichier uploadé" });
        }
        
        // URL relative pour stocker dans la base
        const imageUrl = `assets/images/properties/${req.file.filename}`;
        
        console.log(`✅ Image uploadée: ${imageUrl}`);
        res.json({ url: imageUrl });
    } catch (error) {
        console.error("❌ Erreur upload:", error);
        res.status(500).json({ error: error.message });
    }
});

// Servir les fichiers statiques du dossier Client
app.use(express.static(clientDir));

// Routes API
app.use("/api/reservations", reservationRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/property-reservations", propertyReservationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

console.log("✅ ROUTE ADMIN CHARGÉE");
app.use("/api/reservations-admin", ReservationAdminRoute);

// Test API
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
app.get("/", (req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

/* =========================
   404 HANDLER
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
   GESTION DES ERREURS MULTER
========================= */
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fichier trop volumineux (max 5MB)' });
        }
        return res.status(400).json({ error: error.message });
    }
    if (error.message && error.message.includes('Seules les images')) {
        return res.status(400).json({ error: error.message });
    }
    next(error);
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
    await ensurePropertyColumns(sequelize);
    await ensureReservationAdminColumns(sequelize);
    console.log("✅ Tables synchronisées");

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📁 Upload images vers: ${uploadDir}`);
    });

  } catch (err) {
    console.error("❌ ERREUR START SERVER:", err);
  }
}

startServer();