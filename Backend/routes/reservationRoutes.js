const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

router.post('/', reservationController.createReservation);
router.get('/', reservationController.getReservations);


// ADMIN
router.put('/:id/accept', reservationController.acceptReservation);
router.put('/:id/refuse', reservationController.refuseReservation);

module.exports = router;
