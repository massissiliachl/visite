// routes/propertyReservationRoutes.js
const express = require('express');
const router = express.Router();
const propertyReservationController = require('../controllers/propertyReservationController');

// Vérifiez que toutes les fonctions existent avant de les utiliser
router.post('/', propertyReservationController.createReservation);
router.get('/', propertyReservationController.getAllReservations);
router.get('/:id', propertyReservationController.getReservationById);
router.put('/:id/status', propertyReservationController.updateStatus); 
router.delete('/:id', propertyReservationController.deleteReservation);
router.get('/property/:propertyId', propertyReservationController.getReservationsByProperty);

module.exports = router;