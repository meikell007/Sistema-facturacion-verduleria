const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const productRoutes = require('./routes/productRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Configuración de Middlewares globales
app.use(cors()); // Permitir solicitudes CORS desde el frontend
app.use(express.json()); // Habilitar parseo de cuerpos en formato JSON

// Ruta de estado general de la API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    app: 'Eco Fruver API',
    version: '1.0.0'
  });
});

// Montar enrutadores
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Manejador global de errores (Fallback)
app.use((err, req, res, next) => {
  console.error('Error global no manejado:', err.stack);
  res.status(500).json({
    error: 'Error interno del servidor.',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal.'
  });
});

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta API no encontrada.' });
});

module.exports = app;
