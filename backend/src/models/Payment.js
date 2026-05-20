const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Invoice = require('./Invoice');
const User = require('./User');

const Payment = sequelize.define('PAGOS', {
  id_pago: {
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
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id_usuario'
    }
  },
  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    get() {
      const val = this.getDataValue('monto');
      return val === null ? null : parseFloat(val);
    }
  },
  saldo_anterior: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    get() {
      const val = this.getDataValue('saldo_anterior');
      return val === null ? null : parseFloat(val);
    }
  },
  saldo_posterior: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    get() {
      const val = this.getDataValue('saldo_posterior');
      return val === null ? null : parseFloat(val);
    }
  },
  observacion: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'pagos'
});

module.exports = Payment;
