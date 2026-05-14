const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const ADMIN = {
    email: "admin@visitbejaia.com",
    password: "adminvb2026"
};

router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (email !== ADMIN.email || password !== ADMIN.password) {
        return res.status(401).json({ error: "Identifiants invalides" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "1d"
    });

    res.json({ token });
});

module.exports = router;