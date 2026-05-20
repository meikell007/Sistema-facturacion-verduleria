const { sequelize, Invoice, InvoiceDetail, Client, Product, Audit } = require('../models');
const { Op } = require('sequelize');

// Registrar una nueva venta / factura (Admin y Cajero)
exports.createInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id_cliente, tipo_pago, detalles } = req.body;

    if (!id_cliente || !tipo_pago || !detalles || detalles.length === 0) {
      return res.status(400).json({ error: 'Cliente, tipo de pago y detalles de productos son requeridos.' });
    }

    if (tipo_pago !== 'Contado' && tipo_pago !== 'Credito') {
      return res.status(400).json({ error: 'El tipo de pago debe ser "Contado" o "Credito".' });
    }

    // 1. Obtener y verificar cliente
    const client = await Client.findByPk(id_cliente, { transaction: t });
    if (!client) {
      await t.rollback();
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    if (!client.activo) {
      await t.rollback();
      return res.status(400).json({ error: 'El cliente está inactivo en el sistema.' });
    }

    // 2. Procesar detalles de productos y calcular totales
    let subtotal = 0;
    const processedDetails = [];

    for (const item of detalles) {
      const { id_producto, cantidad } = item;

      if (!id_producto || cantidad === undefined || cantidad <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'ID de producto y cantidad válidos son requeridos en cada línea.' });
      }

      const product = await Product.findByPk(id_producto, { transaction: t });
      if (!product) {
        await t.rollback();
        return res.status(404).json({ error: `Producto con ID ${id_producto} no encontrado.` });
      }

      if (!product.activo) {
        await t.rollback();
        return res.status(400).json({ error: `El producto "${product.descripcion}" está inactivo.` });
      }

      // Validar si es unidad entera para productos de tipo UNIDAD
      if (product.unidad_medida === 'UNIDAD' && !Number.isInteger(cantidad)) {
        await t.rollback();
        return res.status(400).json({ error: `El producto "${product.descripcion}" se vende por UNIDAD, no admite cantidades fraccionadas.` });
      }

      const precio_unitario_venta = product.precio_unitario;
      // Redondear a 2 decimales para evitar problemas de coma flotante
      const subtotal_linea = Math.round(cantidad * precio_unitario_venta * 100) / 100;

      subtotal += subtotal_linea;

      processedDetails.push({
        id_producto,
        cantidad,
        precio_unitario_venta,
        subtotal_linea
      });
    }

    // Cálculo de impuestos (0% por defecto para verdulería, configurable en el futuro)
    const impuesto = 0.00;
    const total = subtotal + impuesto;

    // 3. Regla de negocio crítica (RF-10.1) si el pago es a Crédito
    if (tipo_pago === 'Credito') {
      // Validar si el cliente tiene cupo de crédito asignado
      if (client.limite_credito <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'El cliente no tiene cupo de crédito asignado para realizar compras fiadas.' });
      }

      // Validar cupo de crédito disponible
      const creditoDisponible = client.limite_credito - client.credito_utilizado;
      if (total > creditoDisponible) {
        await t.rollback();
        return res.status(400).json({ 
          error: 'Cupo de crédito insuficiente.', 
          detalles: `El total de la venta ($${total.toFixed(2)}) supera tu cupo disponible ($${creditoDisponible.toFixed(2)}).` 
        });
      }

      // Validar mora extrema (Facturas pendientes de crédito con más de 30 días de retraso)
      const limiteMoraDias = 30;
      const fechaLimiteMora = new Date();
      fechaLimiteMora.setDate(fechaLimiteMora.getDate() - limiteMoraDias);

      const facturasEnMoraExtrema = await Invoice.findOne({
        where: {
          id_cliente: client.id_cliente,
          tipo_pago: 'Credito',
          estado: { [Op.ne]: 'Pagada' },
          fecha_emision: { [Op.lt]: fechaLimiteMora }
        },
        transaction: t
      });

      if (facturasEnMoraExtrema) {
        await t.rollback();
        return res.status(400).json({ 
          error: 'Crédito bloqueado por morosidad.', 
          detalles: `El cliente tiene facturas de crédito vencidas hace más de ${limiteMoraDias} días.` 
        });
      }
    }

    // 4. Generar número correlativo único de factura
    const count = await Invoice.count({ transaction: t });
    const numero_factura = `FAC-${String(count + 1).padStart(6, '0')}`;

    // 5. Configurar saldos según método de pago
    const saldo_pendiente = tipo_pago === 'Credito' ? total : 0.00;
    const estado = tipo_pago === 'Credito' ? 'Pendiente' : 'Pagada';

    // 6. Crear cabecera de la factura
    const invoice = await Invoice.create({
      numero_factura,
      id_cliente,
      id_usuario: req.user.id_usuario, // Registra el cajero/admin logueado
      fecha_emision: new Date(),
      tipo_pago,
      subtotal,
      impuesto,
      total,
      saldo_pendiente,
      estado
    }, { transaction: t });

    // 7. Crear los detalles de la factura
    for (const detail of processedDetails) {
      await InvoiceDetail.create({
        id_factura: invoice.id_factura,
        id_producto: detail.id_producto,
        cantidad: detail.cantidad,
        precio_unitario_venta: detail.precio_unitario_venta,
        subtotal_linea: detail.subtotal_linea
      }, { transaction: t });
    }

    // NOTA: El trigger de PostgreSQL `trg_factura_a_credito` se disparará al insertar la factura,
    // y el trigger de auditoría `trg_auditoria_facturas` también registrará la transacción de forma inmutable.

    await t.commit();

    // Obtener la factura completa para responder
    const completeInvoice = await Invoice.findByPk(invoice.id_factura, {
      include: [
        { model: Client, as: 'cliente' },
        { model: InvoiceDetail, as: 'detalles', include: [{ model: Product, as: 'producto' }] }
      ]
    });

    res.status(201).json(completeInvoice);
  } catch (error) {
    await t.rollback();
    console.error('Error al registrar factura:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la venta.' });
  }
};

// Consultar listado de facturas
exports.getInvoices = async (req, res) => {
  try {
    const { search, tipo_pago, estado } = req.query;
    let whereClause = {};

    if (tipo_pago) whereClause.tipo_pago = tipo_pago;
    if (estado) whereClause.estado = estado;

    let includeClause = [
      { model: Client, as: 'cliente', attributes: ['nombre', 'apellido', 'identificacion'] }
    ];

    if (search) {
      whereClause.numero_factura = { [Op.iLike]: `%${search}%` };
    }

    const invoices = await Invoice.findAll({
      where: whereClause,
      include: includeClause,
      order: [['fecha_emision', 'DESC']]
    });

    res.json(invoices);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ error: 'Error al consultar facturas.' });
  }
};

// Consultar factura específica por ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id, {
      include: [
        { model: Client, as: 'cliente' },
        { model: InvoiceDetail, as: 'detalles', include: [{ model: Product, as: 'producto' }] }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada.' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error al obtener factura por ID:', error);
    res.status(500).json({ error: 'Error al cargar los detalles de la factura.' });
  }
};
