const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
    createReservationAdmin,
    getReservationsAdmin,
    getReservationAdminById,
    updateReservationAdmin,
    deleteReservationAdmin
} = require("../controllers/ReservationAdminController");

const staffOnly = (req, res, next) => {
    const role = req.user?.role;
    if (role !== "admin" && role !== "employeur") {
        return res.status(403).json({ message: "Accès réservé aux employeurs et administrateurs" });
    }
    next();
};

router.use(auth, staffOnly);

router.post("/", createReservationAdmin);
router.get("/", getReservationsAdmin);
router.get("/:id", getReservationAdminById);
router.put("/:id", updateReservationAdmin);
router.delete("/:id", deleteReservationAdmin);

module.exports = router;
