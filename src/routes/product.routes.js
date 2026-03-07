const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// Nanti tambahkan JWT Auth Middleware setelah module auth selesai
// const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/', productController.index);
router.get('/barcode/:barcode', productController.showByBarcode);
router.post('/', productController.store);
router.put('/:id', productController.update);
router.delete('/:id', productController.destroy);

module.exports = router;
