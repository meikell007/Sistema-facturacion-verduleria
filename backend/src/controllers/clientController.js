const { Op } = require('sequelize');
const { Client, Invoice, Payment, Audit } = require('../models');

// Registrar cliente (Admin y Cajero)
exports.createClient = async (req, res) => {
  try {
    const { nombre, apellido, identificacion, tipo_identificacion, telefono, email, direccion, limite_credito } = req.body;

    if (!nombre || !apellido || !identificacion || !tipo_identificacion) {
      return res.status(400).json({ error: 'Nombre, apellido, identificación y tipo de identificación son obligatorios.' });
    }

    // Verificar si ya existe un cliente con esa identificación
    const exists = await Client.findOne({ where: { identificacion } });
    if (exists) {
      return res.status(400).json({ error: 'Ya existe un cliente registrado con esta identificación.' });
    }

    const newClient = await Client.create({
      nombre,
      apellido,
      identificacion,
      tipo_identificacion,
      telefono,
      email,
      direccion,
      limite_credito: limite_credito || 0.00,
      credito_utilizado: 0.00
    });

    // Registrar auditoría
    await Audit.create({
      id_usuario: req.user.id_usuario,
      accion: 'INSERT',
      tabla_afectada: 'CLIENTES',
      descripcion: `Creación del cliente ${nombre} ${apellido} (${tipo_identificacion}: ${identificacion}) con límite de crédito: $${limite_credito || 0.00}.`
    });

    res.status(201).json(newClient);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al registrar el cliente.' });
  }
};

// Consultar clientes por filtros (Admin y Cajero)
exports.getClients = async (req, res) => {
  try {
    const { search } = req.query;
    let whereClause = { activo: true };

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { apellido: { [Op.iLike]: `%${search}%` } },
        { identificacion: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const clients = await Client.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']]
    });

    res.json(clients);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al consultar clientes.' });
  }
};

// Consultar cliente específico
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cliente.' });
  }
};

// Actualizar cliente (Admin y Cajero)
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, identificacion, tipo_identificacion, telefono, email, direccion, limite_credito, activo } = req.body;

    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    // Si cambia identificación, verificar duplicidad
    if (identificacion && identificacion !== client.identificacion) {
      const exists = await Client.findOne({ where: { identificacion } });
      if (exists) {
        return res.status(400).json({ error: 'La identificación ya pertenece a otro cliente.' });
      }
    }

    // Validar que no se baje el límite de crédito por debajo del saldo utilizado
    if (limite_credito !== undefined && limite_credito < client.credito_utilizado) {
      return res.status(400).json({ error: `No se puede reducir el límite de crédito por debajo del cupo ya utilizado ($${client.credito_utilizado}).` });
    }

    await client.update({
      nombre: nombre || client.nombre,
      apellido: apellido || client.apellido,
      identificacion: identificacion || client.identificacion,
      tipo_identificacion: tipo_identificacion || client.tipo_identificacion,
      telefono: telefono !== undefined ? telefono : client.telefono,
      email: email !== undefined ? email : client.email,
      direccion: direccion !== undefined ? direccion : client.direccion,
      limite_credito: limite_credito !== undefined ? limite_credito : client.limite_credito,
      activo: activo !== undefined ? activo : client.activo
    });

    // Registrar auditoría
    await Audit.create({
      id_usuario: req.user.id_usuario,
      accion: 'UPDATE',
      tabla_afectada: 'CLIENTES',
      descripcion: `Modificación de datos del cliente ID: ${client.id_cliente}. Límite de crédito actual: $${client.limite_credito}.`
    });

    res.json(client);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error al actualizar el cliente.' });
  }
};

// Historial completo del cliente (facturas y pagos realizados)
exports.getClientHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    // Obtener facturas asociadas al cliente
    const invoices = await Invoice.findAll({
      where: { id_cliente: id },
      order: [['fecha_emision', 'DESC']]
    });

    // Obtener pagos de cartera de esas facturas
    const invoiceIds = invoices.map(i => i.id_factura);
    let payments = [];
    if (invoiceIds.length > 0) {
      payments = await Payment.findAll({
        where: { id_factura: { [Op.in]: invoiceIds } },
        order: [['fecha_pago', 'DESC']]
      });
    }

    res.json({
      client,
      invoices,
      payments
    });
  } catch (error) {
    console.error('Error al obtener historial del cliente:', error);
    res.status(500).json({ error: 'Error al consultar el historial.' });
  }
};
