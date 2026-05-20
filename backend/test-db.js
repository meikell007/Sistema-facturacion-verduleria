const sequelize = require('./src/config/db');
const Role = require('./src/models/Role');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('--------------------------------------------------');
    console.log('¡CONEXIÓN A LA BASE DE DATOS ECO_FRUVER EXITOSA!');
    console.log('--------------------------------------------------');
    const roles = await Role.findAll();
    console.log('ROLES SEEDADOS CORRECTAMENTE EN LA BASE DE DATOS:');
    console.log(JSON.stringify(roles, null, 2));
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('--------------------------------------------------');
    console.error('¡ERROR DE CONEXIÓN A LA BASE DE DATOS!', error.message);
    console.error('--------------------------------------------------');
    process.exit(1);
  }
}
test();
