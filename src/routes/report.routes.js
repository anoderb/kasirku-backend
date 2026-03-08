const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/report.controller');

// GET /reports/daily?date=2026-03-08 — Ringkasan harian
router.get('/daily', ctrl.daily);

// GET /reports/range?start=..&end=.. — Ringkasan range tanggal
router.get('/range', ctrl.range);

// GET /reports/top-products?start=..&end=..&limit=10 — Produk terlaris
router.get('/top-products', ctrl.topProducts);

// GET /reports/chart?start=..&end=.. — Data chart per hari
router.get('/chart', ctrl.chart);

module.exports = router;
