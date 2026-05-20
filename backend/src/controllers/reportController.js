const { Op } = require('sequelize');
const { Invoice, Payment, Client, Audit, User } = require('../models');

// Reporte de Ventas y Recaudos por Rango de Fechas (RF-REP-01)
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Fecha de inicio y fin son requeridas en formato YYYY-MM-DD.' });
    }

    // Configurar fechas inicio y fin para abarcar todo el día
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 1. Obtener facturas en el rango
    const invoices = await Invoice.findAll({
      where: {
        fecha_emision: {
          [Op.between]: [start, end]
        }
      },
      include: [{ model: Client, as: 'cliente', attributes: ['nombre', 'apellido', 'identificacion'] }],
      order: [['fecha_emision', 'DESC']]
    });

    // 2. Obtener abonos/recaudos en el rango
    const payments = await Payment.findAll({
      where: {
        fecha_pago: {
          [Op.between]: [start, end]
        }
      },
      include: [
        { 
          model: Invoice, 
          as: 'factura', 
          attributes: ['numero_factura'],
          include: [{ model: Client, as: 'cliente', attributes: ['nombre', 'apellido'] }]
        }
      ],
      order: [['fecha_pago', 'DESC']]
    });

    // 3. Consolidar estadísticas
    let totalVendido = 0;
    let totalContado = 0;
    let totalCredito = 0;
    let saldoPendienteGenerado = 0;

    invoices.forEach(inv => {
      totalVendido += inv.total;
      if (inv.tipo_pago === 'Contado') {
        totalContado += inv.total;
      } else {
        totalCredito += inv.total;
        saldoPendienteGenerado += inv.saldo_pendiente;
      }
    });

    let totalRecaudado = 0;
    payments.forEach(pay => {
      totalRecaudado += pay.monto;
    });

    res.json({
      rango: { startDate, endDate },
      resumen: {
        totalVendido,
        totalContado,
        totalCredito,
        saldoPendienteGenerado,
        totalRecaudado
      },
      invoices,
      payments
    });
  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    res.status(500).json({ error: 'Error al procesar el reporte de ventas.' });
  }
};

// Reporte de Clientes en Mora (RF-REP-02)
exports.getDebtorsReport = async (req, res) => {
  try {
    // 1. Obtener todos los clientes que tienen saldo adeudado activo
    const debtors = await Client.findAll({
      where: {
        credito_utilizado: { [Op.gt]: 0 },
        activo: true
      },
      order: [['credito_utilizado', 'DESC']]
    });

    const report = [];

    // 2. Para cada deudor, calcular los días de retraso basados en su factura pendiente más antigua
    for (const debtor of debtors) {
      const oldestPendingInvoice = await Invoice.findOne({
        where: {
          id_cliente: debtor.id_cliente,
          tipo_pago: 'Credito',
          estado: { [Op.ne]: 'Pagada' }
        },
        order: [['fecha_emision', 'ASC']]
      });

      let diasRetraso = 0;
      let numeroFacturaVencida = '';

      if (oldestPendingInvoice) {
        const fechaEmision = new Date(oldestPendingInvoice.fecha_emision);
        const hoy = new Date();
        const diferenciaTiempo = hoy.getTime() - fechaEmision.getTime();
        diasRetraso = Math.floor(diferenciaTiempo / (1000 * 3600 * 24));
        numeroFacturaVencida = oldestPendingInvoice.numero_factura;
      }

      report.push({
        id_cliente: debtor.id_cliente,
        nombre: debtor.nombre,
        apellido: debtor.apellido,
        identificacion: debtor.identificacion,
        tipo_identificacion: debtor.tipo_identificacion,
        telefono: debtor.telefono,
        limite_credito: debtor.limite_credito,
        credito_utilizado: debtor.credito_utilizado,
        cupo_disponible: debtor.limite_credito - debtor.credito_utilizado,
        factura_mas_antigua: numeroFacturaVencida,
        dias_retraso: diasRetraso
      });
    }

    res.json(report);
  } catch (error) {
    console.error('Error al generar reporte de deudores:', error);
    res.status(500).json({ error: 'Error al procesar el reporte de deudores.' });
  }
};

// Consultar Pista de Auditoría Interna (RF-AD-01) - Solo Administrador
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await Audit.findAll({
      include: [{ model: User, as: 'usuario', attributes: ['username', 'nombre', 'apellido'] }],
      order: [['fecha_hora', 'DESC']],
      limit: 100 // Capped at last 100 for safety, can be customized
    });
    res.json(logs);
  } catch (error) {
    console.error('Error al consultar auditoría:', error);
    res.status(500).json({ error: 'Error al consultar logs de auditoría.' });
  }
};
