const debtService = require('../services/debt.service');
const customerService = require('../services/customer.service');
const { successRes, errorRes } = require('../utils/response');

exports.getCustomerDebts = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await customerService.getCustomerById(customerId);
    if (!customer) return errorRes(res, 'Pelanggan tidak ditemukan', 404);

    const debts = await debtService.getDebtsByCustomer(customerId);
    return successRes(res, {
      customer,
      debts
    }, 'Berhasil memuat hutang pelanggan');
  } catch (err) {
    return errorRes(res, err.message, 500);
  }
};

exports.getAllSummary = async (req, res) => {
  try {
    const summary = await debtService.getAllDebtsSummary();
    return successRes(res, summary, 'Berhasil memuat ringkasan hutang');
  } catch (err) {
    return errorRes(res, err.message, 500);
  }
};

exports.createDebt = async (req, res) => {
  try {
    const { customer_id, total_amount } = req.body;
    if (!customer_id || !total_amount) {
      return errorRes(res, 'ID Pelanggan dan Total Hutang wajib diisi', 400);
    }
    
    const debt = await debtService.createDebt(req.body);
    return successRes(res, debt, 'Hutang berhasil dicatat', 201);
  } catch (err) {
    return errorRes(res, err.message, 400);
  }
};

exports.payDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    if (!amount) {
      return errorRes(res, 'Nominal pembayaran wajib diisi', 400);
    }

    const updatedDebt = await debtService.payDebt(id, req.body);
    return successRes(res, updatedDebt, 'Pembayaran hutang berhasil dicatat');
  } catch (err) {
    return errorRes(res, err.message, 400);
  }
};
