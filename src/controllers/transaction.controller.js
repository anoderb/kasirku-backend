const transactionService = require('../services/transaction.service');
const { successRes, errorRes } = require('../utils/response');

/**
 * GET /transactions — List semua transaksi
 */
exports.index = async (req, res) => {
  try {
    const data = await transactionService.getAllTransactions(req);
    return successRes(res, data.items, 'Data transaksi berhasil diambil', 200, data.meta);
  } catch (err) {
    return errorRes(res, err.message);
  }
};

/**
 * GET /transactions/:id — Detail transaksi + items
 */
exports.show = async (req, res) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);
    if (!transaction) {
      return errorRes(res, 'Transaksi tidak ditemukan', 404);
    }
    return successRes(res, transaction, 'Detail transaksi berhasil diambil');
  } catch (err) {
    return errorRes(res, err.message);
  }
};

/**
 * POST /transactions — Buat transaksi baru
 */
exports.store = async (req, res) => {
  try {
    const { cashier_id, total_amount, final_amount, payment_method } = req.body;

    // Validasi input wajib
    if (!cashier_id || total_amount === undefined || final_amount === undefined || !payment_method) {
      return errorRes(res, 'cashier_id, total_amount, final_amount, dan payment_method wajib diisi', 400);
    }

    const transaction = await transactionService.createTransaction(req.body);
    return successRes(res, transaction, 'Transaksi berhasil disimpan', 201);
  } catch (err) {
    return errorRes(res, err.message);
  }
};
