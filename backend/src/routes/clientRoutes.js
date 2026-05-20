const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Acceso habilitado tanto para Administrador como para Cajero
router.post('/', auth, authorize('Administrador', 'Cajero'), clientController.createClient);
router.get('/', auth, authorize('Administrador', 'Cajero'), clientController.getClients);
router.get('/:id', auth, authorize('Administrador', 'Cajero'), clientController.getClientById);
router.put('/:id', auth, authorize('Administrador', 'Cajero'), clientController.updateClient);
router.get('/:id/history', auth, authorize('Administrador', 'Cajero'), clientController.getClientHistory);

module.exports = router;
