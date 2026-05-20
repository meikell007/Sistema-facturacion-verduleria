const { sequelize, Invoice, Payment, Client, Audit } = require('../models');

// Registrar un pago / abono a cartera (Admin y Cajero)
exports.registerPayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id_factura, monto, observacion } = req.body;

    if (!id_factura || monto === undefined || monto <= 0) {
      return res.status(400).json({ error: 'ID de factura y monto válido mayor a cero son requeridos.' });
    }

    // 1. Obtener la factura
    const invoice = await Invoice.findByPk(id_factura, {
      include: [{ model: Client, as: 'cliente' }],
      transaction: t
    });

    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ error: 'Factura no encontrada.' });
    }

    if (invoice.tipo_pago !== 'Credito') {
      await t.rollback();
      return res.status(400).json({ error: 'La factura seleccionada no corresponde a una venta a crédito.' });
    }

    if (invoice.estado === 'Pagada') {
      await t.rollback();
      return res.status(400).json({ error: 'La factura seleccionada ya se encuentra totalmente pagada.' });
    }

    // 2. Validar que el abono no supere el saldo pendiente
    const saldo_anterior = invoice.saldo_pendiente;
    if (monto > saldo_anterior) {
      await t.rollback();
      return res.status(400).json({ 
        error: 'El abono supera el saldo pendiente.', 
        detalles: `El monto ingresado ($${monto.toFixed(2)}) es mayor al saldo pendiente actual ($${saldo_anterior.toFixed(2)}).` 
      });
    }

    // 3. Calcular nuevo saldo posterior
    // Redondear a 2 decimales para evitar problemas de flotante
    const saldo_posterior = Math.round((saldo_anterior - monto) * 100) / 100;
    
    // Configurar nuevo estado de la factura
    const nuevoEstado = saldo_posterior === 0 ? 'Pagada' : 'Parcialmente_Pagada';

    // 4. Crear registro en la tabla PAGOS
    const payment = await Payment.create({
      id_factura: invoice.id_factura,
      id_usuario: req.user.id_usuario, // Registra el cajero que recibe el recaudo
      fecha_pago: new Date(),
      monto,
      saldo_anterior,
      saldo_posterior,
      observacion: observacion || 'Abono ordinario a cartera.'
    }, { transaction: t });

    // 5. Actualizar los saldos en la cabecera de la factura
    await invoice.update({
      saldo_pendiente: saldo_posterior,
      estado: nuevoEstado
    }, { transaction: t });

    // NOTA: El trigger de Postgres `trg_abono_cartera` se disparará al insertar en PAGOS
    // y restará el `monto` del `credito_utilizado` de la tabla CLIENTES de forma inmutable.

    await t.commit();

    res.status(201).json({
      message: 'Abono registrado exitosamente.',
      pago: payment,
      factura: {
        id_factura: invoice.id_factura,
        numero_factura: invoice.numero_factura,
        saldo_pendiente: saldo_posterior,
        estado: nuevoEstado
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al registrar abono:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el recaudo.' });
  }
};

// Consultar facturas pendientes por cliente (Admin y Cajero)
exports.getPendingInvoicesByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    const invoices = await Invoice.findAll({
      where: {
        id_cliente: clientId,
        tipo_pago: 'Credito',
        estado: ['Pendiente', 'Parcialmente_Pagada']
      },
      order: [['fecha_emision', 'ASC']]
    });

    res.json(invoices);
  } catch (error) {
    console.error('Error al obtener facturas pendientes del cliente:', error);
    res.status(500).json({ error: 'Error al consultar facturas de cartera.' });
  }
};

// Listar todos los abonos históricos
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Invoice,
          as: 'factura',
          attributes: ['numero_factura', 'total'],
          include: [{ model: Client, as: 'cliente', attributes: ['nombre', 'apellido', 'identificacion'] }]
        }
      ],
      order: [['fecha_pago', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    console.error('Error al consultar historial de pagos:', error);
    res.status(500).json({ error: 'Error al obtener pagos históricos.' });
  }
};
