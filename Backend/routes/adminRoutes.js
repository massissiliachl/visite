const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const adminController = require("../controllers/adminController");
const activityController = require("../controllers/activityController");

const ADMIN = {
    email: "admin@visitbejaia.com",
    password: "visitbejaia@06"
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
        process.env.JWT_SECRET || "SECRET_KEY",
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

// ===== ACTIVITÉS =====
router.get("/activities", activityController.getAllActivities);
router.get("/activities/:slug", activityController.getActivityBySlug);
router.post("/activities", activityController.createActivity);
router.put("/activities/:slug", activityController.updateActivity);
router.patch("/activities/:slug/publish", activityController.togglePublish);
router.delete("/activities/:slug", activityController.deleteActivity);

module.exports = router;