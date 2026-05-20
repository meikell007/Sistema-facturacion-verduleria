const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Registro de abonos y consultas de deudas habilitados para ambos roles
router.post('/', auth, authorize('Administrador', 'Cajero'), paymentController.registerPayment);
router.get('/client/:clientId', auth, authorize('Administrador', 'Cajero'), paymentController.getPendingInvoicesByClient);
router.get('/history', auth, authorize('Administrador', 'Cajero'), paymentController.getPaymentHistory);

module.exports = router;
