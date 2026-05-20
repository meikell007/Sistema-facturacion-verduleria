const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Client = sequelize.define('CLIENTES', {
  id_cliente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  identificacion: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  tipo_identificacion: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(20)
  },
  email: {
    type: DataTypes.STRING(150)
  },
  direccion: {
    type: DataTypes.TEXT
  },
  limite_credito: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    get() {
      const val = this.getDataValue('limite_credito');
      return val === null ? null : parseFloat(val);
    }
  },
  credito_utilizado: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    get() {
      const val = this.getDataValue('credito_utilizado');
      return val === null ? null : parseFloat(val);
    }
  },
  fecha_registro: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'clientes'
});

module.exports = Client;
