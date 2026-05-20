const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Desactivar logs para mantener consola limpia, activar para depurar SQL
    define: {
      timestamps: false, // Desactivamos timestamps por defecto de Sequelize
      freezeTableName: true // Evitamos que Sequelize pluralice automáticamente los nombres de las tablas
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
