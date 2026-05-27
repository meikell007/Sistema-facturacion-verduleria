const { Op } = require('sequelize');
const { Product, Audit } = require('../models');

// Registrar producto en catálogo (Admin)
exports.createProduct = async (req, res) => {
  try {
    const { descripcion, precio_unitario, unidad_medida } = req.body;

    if (!descripcion || precio_unitario === undefined) {
      return res.status(400).json({ error: 'Descripción y precio unitario son requeridos.' });
    }

    if (!precio_unitario || Number(precio_unitario) <= 0) {
      return res.status(400).json({ error: 'El precio unitario debe ser mayor a $0.' });
    }

    const newProduct = await Product.create({
      descripcion,
      precio_unitario,
      unidad_medida: unidad_medida || 'UNIDAD',
      activo: true
    });

    // Auditoría
    await Audit.create({
      id_usuario: req.user.id_usuario,
      accion: 'INSERT',
      tabla_afectada: 'PRODUCTOS',
      descripcion: `Creación del producto "${descripcion}" ($${precio_unitario} por ${unidad_medida || 'UNIDAD'}).`
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al registrar el producto.' });
  }
};

// Consultar catálogo de productos (Admin y Cajero)
exports.getProducts = async (req, res) => {
  try {
    const { search } = req.query;
    let whereClause = { activo: true };

    if (search) {
      whereClause.descripcion = { [Op.iLike]: `%${search}%` };
    }

    const products = await Product.findAll({
      where: whereClause,
      order: [['descripcion', 'ASC']]
    });

    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al consultar catálogo.' });
  }
};

// Consultar producto por ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto.' });
  }
};

// Actualizar producto e historial de precios (Admin)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, precio_unitario, unidad_medida, activo } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const oldPrice = product.precio_unitario;

    await product.update({
      descripcion: descripcion || product.descripcion,
      precio_unitario: precio_unitario !== undefined ? precio_unitario : product.precio_unitario,
      unidad_medida: unidad_medida || product.unidad_medida,
      activo: activo !== undefined ? activo : product.activo,
      fecha_actualizacion: precio_unitario !== undefined && precio_unitario !== oldPrice ? new Date() : product.fecha_actualizacion
    });

    // Auditoría
    await Audit.create({
      id_usuario: req.user.id_usuario,
      accion: 'UPDATE',
      tabla_afectada: 'PRODUCTOS',
      descripcion: `Modificación del producto ID: ${product.id_producto}. Cambio de precio: $${oldPrice} -> $${product.precio_unitario}.`
    });

    res.json(product);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto.' });
  }
};