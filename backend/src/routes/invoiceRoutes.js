const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Registro de ventas y consultas habilitadas para ambos roles de punto de venta
router.post('/', auth, authorize('Administrador', 'Cajero'), invoiceController.createInvoice);
router.get('/', auth, authorize('Administrador', 'Cajero'), invoiceController.getInvoices);
router.get('/:id', auth, authorize('Administrador', 'Cajero'), invoiceController.getInvoiceById);

module.exports = router;
