const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');
// const authMiddleware = require('../middleware/auth.middleware');
// const roleMiddleware = require('../middleware/role.middleware');

// Sementara tanpa authMiddleware untuk memudahkan testing
// router.use(authMiddleware);

router.get('/low', stockController.getLowStock);
router.get('/movements', stockController.getMovements);
// router.post('/restock', roleMiddleware(['admin', 'owner']), stockController.restock);
router.post('/restock', stockController.restock);

module.exports = router;
