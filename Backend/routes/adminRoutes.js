const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const adminController = require("../controllers/adminController");

const ADMIN = {
    email: "admin@visitbejaia.com",
    password: "adminvb2026"
};

// LOGIN ADMIN
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (
        email !== ADMIN.email ||
        password !== ADMIN.password
    ) {
        return res.status(401).json({
            error: "Identifiants invalides"
        });
    }

    const token = jwt.sign(
        { email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({ token });
});

// GET tous les hébergements
router.get(
    "/properties",
    adminController.getAllProperties
);

// GET un hébergement
router.get(
    "/properties/:id",
    adminController.getPropertyById
);

// CREATE hébergement
router.post(
    "/properties",
    adminController.createProperty
);

// UPDATE hébergement
router.put(
    "/properties/:id",
    adminController.updateProperty
);

// DELETE hébergement
router.delete(
    "/properties/:id",
    adminController.deleteProperty
);

module.exports = router;