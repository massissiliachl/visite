const express = require("express");
const router = express.Router();

const {
    createReservationAdmin,
    getReservationsAdmin,
    getReservationAdminById,
    updateReservationAdmin,
    deleteReservationAdmin
} = require("../controllers/ReservationAdminController");


// POST
router.post("/", createReservationAdmin);


// GET ALL
router.get("/", getReservationsAdmin);


// GET ONE
router.get("/:id", getReservationAdminById);


// UPDATE
router.put("/:id", updateReservationAdmin);


// DELETE
router.delete("/:id", deleteReservationAdmin);


module.exports = router;