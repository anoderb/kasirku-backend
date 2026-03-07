const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debt.controller');

// Catat peminjaman/hutang
router.post('/', debtController.createDebt);
// Cek riwayat hutang pelanggan
router.get('/customer/:customerId', debtController.getCustomerDebts);
// Summary seluruh hutang pelanggan
router.get('/summary', debtController.getAllSummary);
// Bayar / cicil hutang
router.post('/:id/pay', debtController.payDebt);

module.exports = router;
