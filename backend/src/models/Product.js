const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('PRODUCTOS', {
  id_producto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    get() {
      const val = this.getDataValue('precio_unitario');
      return val === null ? null : parseFloat(val);
    }
  },
  unidad_medida: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'UNIDAD' // 'KG' | 'UNIDAD'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'productos'
});

module.exports = Product;
