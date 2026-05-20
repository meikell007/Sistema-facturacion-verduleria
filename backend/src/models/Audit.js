const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Audit = sequelize.define('AUDITORIA', {
  id_auditoria: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id_usuario'
    }
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  accion: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tabla_afectada: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'auditoria'
});

module.exports = Audit;
