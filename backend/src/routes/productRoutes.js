const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Lectura de catálogo permitida para ambos roles
router.get('/', auth, authorize('Administrador', 'Cajero'), productController.getProducts);
router.get('/:id', auth, authorize('Administrador', 'Cajero'), productController.getProductById);

// Escritura y cambios de catálogo restringidos solo al Administrador
router.post('/', auth, authorize('Administrador'), productController.createProduct);
router.put('/:id', auth, authorize('Administrador'), productController.updateProduct);

module.exports = router;
