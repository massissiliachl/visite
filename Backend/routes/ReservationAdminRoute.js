const express = require("express");
const router = express.Router();

const controller = require("../controllers/ReservationAdminController");

router.post("/", controller.createReservation);
router.get("/", controller.getAllReservations);
router.delete("/:id", controller.deleteReservation);
router.put("/:id", controller.updateReservation);

module.exports = router;