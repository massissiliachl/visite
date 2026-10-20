const jwt = require("jsonwebtoken");

const HARDCODED_ADMIN_EMAIL = "admin@visitbejaia.com";

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Token manquant" });
    }

    let token = authHeader;
    if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "SECRET_KEY"
        );

        // JWT issu par /api/admin/login (email only) → rôle admin
        if (!decoded.role && decoded.email === HARDCODED_ADMIN_EMAIL) {
            decoded.role = "admin";
        }

        req.user = decoded;
        req.admin = decoded;
        next();
    } catch (error) {
        console.error("❌ Erreur token:", error.message);
        return res.status(401).json({ error: "Token invalide ou expiré" });
    }
};

module.exports = auth;
