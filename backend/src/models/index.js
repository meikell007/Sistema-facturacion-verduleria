const sequelize = require('../config/db');
const Role = require('./Role');
const User = require('./User');
const Client = require('./Client');
const Product = require('./Product');
const Invoice = require('./Invoice');
const InvoiceDetail = require('./InvoiceDetail');
const Payment = require('./Payment');
const Audit = require('./Audit');

// 1. Relación Roles y Usuarios
Role.hasMany(User, { foreignKey: 'id_rol' });
User.belongsTo(Role, { foreignKey: 'id_rol', as: 'rol' });

// 2. Relación Usuarios y Facturas
User.hasMany(Invoice, { foreignKey: 'id_usuario' });
Invoice.belongsTo(User, { foreignKey: 'id_usuario', as: 'usuario' });

// 3. Relación Clientes y Facturas
Client.hasMany(Invoice, { foreignKey: 'id_cliente' });
Invoice.belongsTo(Client, { foreignKey: 'id_cliente', as: 'cliente' });

// 4. Relación Facturas y DetalleFactura
Invoice.hasMany(InvoiceDetail, { foreignKey: 'id_factura', as: 'detalles', onDelete: 'CASCADE' });
InvoiceDetail.belongsTo(Invoice, { foreignKey: 'id_factura' });

// 5. Relación Productos y DetalleFactura
Product.hasMany(InvoiceDetail, { foreignKey: 'id_producto' });
InvoiceDetail.belongsTo(Product, { foreignKey: 'id_producto', as: 'producto' });

// 6. Relación Facturas y Pagos
Invoice.hasMany(Payment, { foreignKey: 'id_factura', as: 'pagos' });
Payment.belongsTo(Invoice, { foreignKey: 'id_factura', as: 'factura' });

// 7. Relación Usuarios y Pagos
User.hasMany(Payment, { foreignKey: 'id_usuario' });
Payment.belongsTo(User, { foreignKey: 'id_usuario', as: 'usuario' });

// 8. Relación Usuarios y Auditoría
User.hasMany(Audit, { foreignKey: 'id_usuario' });
Audit.belongsTo(User, { foreignKey: 'id_usuario', as: 'usuario' });

module.exports = {
  sequelize,
  Role,
  User,
  Client,
  Product,
  Invoice,
  InvoiceDetail,
  Payment,
  Audit
};
