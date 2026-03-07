const supplierService = require('../services/supplier.service');
const { successRes, errorRes } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const suppliers = await supplierService.getAllSuppliers();
    return successRes(res, suppliers, 'Berhasil memuat data supplier');
  } catch (err) {
    return errorRes(res, err.message, 500);
  }
};

exports.getById = async (req, res) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    if (!supplier) return errorRes(res, 'Supplier tidak ditemukan', 404);
    return successRes(res, supplier, 'Berhasil memuat detail supplier');
  } catch (err) {
    return errorRes(res, err.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return errorRes(res, 'Nama supplier wajib diisi', 400);

    const supplier = await supplierService.createSupplier(req.body);
    return successRes(res, supplier, 'Supplier berhasil ditambahkan', 201);
  } catch (err) {
    return errorRes(res, err.message, 400);
  }
};

exports.update = async (req, res) => {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    return successRes(res, supplier, 'Supplier berhasil diperbarui');
  } catch (err) {
    return errorRes(res, err.message, 400);
  }
};

exports.delete = async (req, res) => {
  try {
    await supplierService.deleteSupplier(req.params.id);
    return successRes(res, null, 'Supplier berhasil dihapus');
  } catch (err) {
    return errorRes(res, err.message, 400);
  }
};
