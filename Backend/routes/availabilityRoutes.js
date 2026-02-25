// routes/availabilityRoutes.js
const express = require('express');
const router = express.Router();
const blockedController = require('../controllers/blockedController');

// Récupérer toutes les dates bloquées pour une activité
router.get('/:nom_item', blockedController.getBlockedDates);

// Bloquer une date
router.post('/block', blockedController.blockDate);

// Débloquer une date
router.delete('/block/:nom_item/:date', blockedController.unblockDate);

module.exports = router;
