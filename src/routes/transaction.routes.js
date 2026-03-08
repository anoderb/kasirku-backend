const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transaction.controller');

// GET /transactions — List transaksi (filter: ?date=, ?start_date=&end_date=, ?search=)
router.get('/', ctrl.index);

// GET /transactions/:id — Detail transaksi + items
router.get('/:id', ctrl.show);

// POST /transactions — Buat transaksi baru
router.post('/', ctrl.store);

module.exports = router;
