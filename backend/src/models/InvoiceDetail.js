const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Invoice = require('./Invoice');
const Product = require('./Product');

const InvoiceDetail = sequelize.define('DETALLE_FACTURA', {
  id_detalle: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_factura: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Invoice,
      key: 'id_factura'
    }
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id_producto'
    }
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 3), // Permite decimales exactos (ej. 0.455 KG)
    allowNull: false,
    get() {
      const val = this.getDataValue('cantidad');
      return val === null ? null : parseFloat(val);
    }
  },
  precio_unitario_venta: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    get() {
      const val = this.getDataValue('precio_unitario_venta');
      return val === null ? null : parseFloat(val);
    }
  },
  subtotal_linea: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    get() {
      const val = this.getDataValue('subtotal_linea');
      return val === null ? null : parseFloat(val);
    }
  }
}, {
  tableName: 'detalle_factura'
});

module.exports = InvoiceDetail;
