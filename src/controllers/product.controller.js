const productService = require('../services/product.service');
const { successRes, errorRes } = require('../utils/response');

exports.index = async (req, res) => {
  try {
    const data = await productService.getAllProducts(req);
    return successRes(res, data.items, 'Data produk berhasil diambil', 200, data.meta);
  } catch (err) {
    return errorRes(res, err.message);
  }
};

exports.showByBarcode = async (req, res) => {
  try {
    const product = await productService.getProductByBarcode(req.params.barcode);
    if (!product) {
      return errorRes(res, 'Produk tidak ditemukan', 404);
    }
    return successRes(res, product, 'Produk ditemukan');
  } catch (err) {
    return errorRes(res, err.message);
  }
};

exports.store = async (req, res) => {
  try {
    const { name, buy_price, sell_price } = req.body;
    
    // Basic validation
    if (!name || buy_price === undefined || sell_price === undefined) {
      return errorRes(res, 'Nama, Harga Beli, dan Harga Jual wajib diisi', 400);
    }

    const product = await productService.createProduct(req.body);
    return successRes(res, product, 'Produk berhasil ditambahkan', 201);
  } catch (err) {
    return errorRes(res, err.message, err.message.includes('sudah') ? 400 : 500);
  }
};

exports.update = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return successRes(res, product, 'Produk berhasil diupdate');
  } catch (err) {
    return errorRes(res, err.message, err.message.includes('tidak ditemukan') ? 404 : 400);
  }
};

exports.destroy = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    return successRes(res, null, 'Produk berhasil dihapus');
  } catch (err) {
    return errorRes(res, err.message);
  }
};
