const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Endpoint público para iniciar sesión
router.post('/login', authController.login);

// Endpoints protegidos (cualquier rol autenticado)
router.post('/logout', auth, authController.logout);
router.get('/profile', auth, authController.getProfile);

// Endpoints restringidos exclusivamente para Administrador
router.post('/register', auth, authorize('Administrador'), authController.registerUser);
router.get('/users', auth, authorize('Administrador'), authController.listUsers);

module.exports = router;
