const stockService = require('../services/stock.service');
const { successRes, errorRes } = require('../utils/response');

exports.getLowStock = async (req, res) => {
  try {
    const products = await stockService.getLowStockProducts();
    return successRes(res, products, 'Berhasil mengambil produk stok menipis');
  } catch (err) {
    return errorRes(res, err.message, 500);
  }
};

exports.getMovements = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await stockService.getRecentMovements(page, limit);
    return successRes(res, result.items, 'Berhasil mengambil riwayat stok', 200, result.meta);
  } catch (err) {
    return errorRes(res, err.message, 500);
  }
};

exports.restock = async (req, res) => {
  try {
    const { product_id, quantity, note, device_id } = req.body;
    
    if (!product_id || !quantity) {
      return errorRes(res, 'Product ID dan Kuantitas wajib diisi', 400);
    }

    const updatedProduct = await stockService.restockProduct({
      product_id,
      quantity,
      note,
      device_id
    });
    
    return successRes(res, updatedProduct, 'Restock berhasil', 201);
  } catch (err) {
    return errorRes(res, err.message, 400);
  }
};
