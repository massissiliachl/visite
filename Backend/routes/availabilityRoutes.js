const express = require('express');
const router = express.Router();
const blockedController = require('../controllers/blockedController');

// Routes pour les activités
router.get('/activity/:nom_item', blockedController.getBlockedDates);
router.post('/block', blockedController.blockDate);
router.delete('/activity/block/:nom_item/:date', blockedController.unblockDate);

// Routes pour les hébergements
router.get('/property/:propertyId', blockedController.getBlockedDatesByProperty);
router.delete('/property/block/:propertyId/:date', blockedController.unblockPropertyDate);

module.exports = router;