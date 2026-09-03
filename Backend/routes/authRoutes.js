const express = require('express');
const router = express.Router();
const userController = require('../controllers/authController');
const auth = require('../middleware/auth');

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Accès administrateur requis" });
  }
  next();
};

// Routes publiques
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/test', userController.createTestUser);
router.post('/logout', auth, userController.logout);

// Routes protégées (à protéger avec middleware admin)
router.get('/employeurs', auth, adminOnly, userController.getEmployeurs);
router.get('/all', auth, adminOnly, userController.getAllUsers);
router.put('/:id', auth, userController.updateUser);
router.put('/:id/status', auth, adminOnly, userController.toggleUserStatus);
router.put('/:id/reset-password', auth, adminOnly, userController.resetPassword);
router.delete('/:id', auth, adminOnly, userController.deleteUser);

module.exports = router;