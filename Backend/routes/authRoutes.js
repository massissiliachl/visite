const express = require('express');
const router = express.Router();
const userController = require('../controllers/authController');

// Routes publiques
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/test', userController.createTestUser);

// Routes protégées (à protéger avec middleware admin)
router.get('/employeurs', userController.getEmployeurs);
router.get('/all', userController.getAllUsers);
router.put('/:id/status', userController.toggleUserStatus);
router.put('/:id/reset-password', userController.resetPassword);
router.delete('/:id', userController.deleteUser);

module.exports = router;