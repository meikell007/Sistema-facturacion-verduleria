const app = require('./app');
const sequelize = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Autenticar la conexión con la base de datos PostgreSQL
    // NOTA: NO llamamos a sequelize.sync() ya que las tablas, restricciones,
    // triggers y datos semilla se crearon y orquestaron de forma exacta en Docker con init-db.sql.
    await sequelize.authenticate();
    console.log('==================================================');
    console.log('📡 Base de datos PostgreSQL conectada con éxito.');

    // 2. Iniciar el servidor web de Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor Eco Fruver API ejecutándose en el puerto ${PORT}`);
      console.log(`👉 Endpoint de salud: http://localhost:${PORT}/api/health`);
      console.log('==================================================');
    });
  } catch (error) {
    console.error('==================================================');
    console.error('❌ ERROR FATAL AL INICIAR EL SERVIDOR API:', error.message);
    console.error('==================================================');
    process.exit(1);
  }
}

startServer();
