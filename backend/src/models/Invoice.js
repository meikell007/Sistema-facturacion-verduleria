const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Client = require('./Client');
const User = require('./User');

const Invoice = sequelize.define('FACTURAS', {
  id_factura: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_factura: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Client,
      key: 'id_cliente'
    }
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id_usuario'
    }
  },
  fecha_emision: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  tipo_pago: {
    type: DataTypes.STRING(10),
    allowNull: false // 'Contado' | 'Credito'
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    get() {
      const val = this.getDataValue('subtotal');
      return val === null ? null : parseFloat(val);
    }
  },
  impuesto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    get() {
      const val = this.getDataValue('impuesto');
      return val === null ? null : parseFloat(val);
    }
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    get() {
      const val = this.getDataValue('total');
      return val === null ? null : parseFloat(val);
    }
  },
  saldo_pendiente: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    get() {
      const val = this.getDataValue('saldo_pendiente');
      return val === null ? null : parseFloat(val);
    }
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Pendiente' // 'Pendiente' | 'Parcialmente_Pagada' | 'Pagada'
  }
}, {
  tableName: 'facturas'
});

module.exports = Invoice;
