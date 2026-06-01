const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    console.log("🔐 Auth header reçu:", authHeader ? "Oui" : "Non");
    
    if (!authHeader) {
        return res.status(401).json({ error: "Token manquant" });
    }
    
    // Extrait le token (supporte "Bearer xxx" ou "xxx")
    let token = authHeader;
    if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }
    
    console.log("🔑 Token extrait:", token ? token.substring(0, 20) + "..." : "Non");
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token valide pour:", decoded.email);
        req.user = decoded;
        req.admin = decoded;
        next();
    } catch (error) {
        console.error("❌ Erreur token:", error.message);
        return res.status(401).json({ error: "Token invalide ou expiré" });
    }
};

module.exports = auth;