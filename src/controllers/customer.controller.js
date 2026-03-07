const customerService = require('../services/customer.service');
const { successRes, errorRes } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const customers = await customerService.getAllCustomers();
    return successRes(res, customers, 'Berhasil memuat pelanggan');
  } catch (err) {
    return errorRes(res, err.message, 500);
  }
};

exports.getById = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) return errorRes(res, 'Pelanggan tidak ditemukan', 404);
    return successRes(res, customer, 'Berhasil memuat data pelanggan');
  } catch (err) {
    return errorRes(res, err.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.name) {
      return errorRes(res, 'Nama pelanggan wajib diisi', 400);
    }
    const customer = await customerService.createCustomer(req.body);
    return successRes(res, customer, 'Pelanggan berhasil ditambahkan', 201);
  } catch (err) {
    return errorRes(res, err.message, 400);
  }
};

exports.update = async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    return successRes(res, customer, 'Pelanggan berhasil diperbarui');
  } catch (err) {
    return errorRes(res, err.message, 400);
  }
};
