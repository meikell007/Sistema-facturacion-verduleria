const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Reporte de Ventas y Recaudos (Solo Administrador)
router.get('/sales', auth, authorize('Administrador'), reportController.getSalesReport);

// Reporte de Auditoría Interna (Solo Administrador)
router.get('/audit', auth, authorize('Administrador'), reportController.getAuditLogs);

// Reporte de Clientes en Mora (Habilitado para Administrador y Cajero)
// ya que el cajero necesita identificar rápidamente a deudores
router.get('/debtors', auth, authorize('Administrador', 'Cajero'), reportController.getDebtorsReport);

module.exports = router;
