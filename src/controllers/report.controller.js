const reportService = require('../services/report.service');
const { successRes, errorRes } = require('../utils/response');

/**
 * GET /reports/daily?date=2026-03-08
 * Ringkasan harian (default: hari ini)
 */
exports.daily = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const data = await reportService.getDailySummary(date);
    return successRes(res, data, 'Laporan harian berhasil diambil');
  } catch (err) {
    return errorRes(res, err.message);
  }
};

/**
 * GET /reports/range?start=2026-03-01&end=2026-03-08
 * Ringkasan berdasarkan range tanggal
 */
exports.range = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return errorRes(res, 'Parameter start dan end wajib diisi', 400);
    }

    const data = await reportService.getRangeSummary(start, end);
    return successRes(res, data, 'Laporan range berhasil diambil');
  } catch (err) {
    return errorRes(res, err.message);
  }
};

/**
 * GET /reports/top-products?start=2026-03-01&end=2026-03-08&limit=10
 * Produk terlaris
 */
exports.topProducts = async (req, res) => {
  try {
    const { start, end, limit } = req.query;
    if (!start || !end) {
      return errorRes(res, 'Parameter start dan end wajib diisi', 400);
    }

    const data = await reportService.getTopProducts(start, end, limit || 10);
    return successRes(res, data, 'Data produk terlaris berhasil diambil');
  } catch (err) {
    return errorRes(res, err.message);
  }
};

/**
 * GET /reports/chart?start=2026-03-01&end=2026-03-08
 * Data chart penjualan per hari
 */
exports.chart = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return errorRes(res, 'Parameter start dan end wajib diisi', 400);
    }

    const data = await reportService.getSalesChart(start, end);
    return successRes(res, data, 'Data chart berhasil diambil');
  } catch (err) {
    return errorRes(res, err.message);
  }
};
