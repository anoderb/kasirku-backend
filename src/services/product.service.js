const db = require('../database');
const { v4: uuidv4 } = require('uuid');

exports.getAllProducts = async (req) => {
  const { search, category, page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  let whereClause = 'WHERE p.is_active = 1';
  const params = [];

  if (search) {
    whereClause += ' AND (p.name LIKE ? OR p.barcode LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    whereClause += ' AND p.category_id = ?';
    params.push(category);
  }

  // Gunakan db.query (bukan db.execute) dan LIMIT/OFFSET langsung di SQL string
  // karena mysql2 prepared statement tidak kompatibel dengan dynamic SQL + LIMIT params
  const [products] = await db.query(
    `SELECT p.*, c.name AS category_name, s.name AS supplier_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     ${whereClause}
     ORDER BY p.name ASC
     LIMIT ${limitNum} OFFSET ${skip}`,
    params
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM products p ${whereClause}`,
    params
  );

  return {
    items: products,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

exports.getProductByBarcode = async (barcode) => {
  const [rows] = await db.execute(
    `SELECT p.*, c.name AS category_name 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.barcode = ? AND p.is_active = 1`,
    [barcode]
  );
  return rows[0] || null;
};

exports.getProductById = async (id) => {
  const [rows] = await db.execute(
    `SELECT p.*, c.name AS category_name, s.name AS supplier_name 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE p.id = ? AND p.is_active = 1`,
    [id]
  );
  return rows[0] || null;
};

exports.createProduct = async (data) => {
  // Cek duplikat barcode
  if (data.barcode) {
    const [exists] = await db.execute(
      'SELECT id FROM products WHERE barcode = ?',
      [data.barcode]
    );
    if (exists.length > 0) throw new Error('Barcode sudah terdaftar');
  }

  const id = data.id || uuidv4();

  await db.execute(
    `INSERT INTO products 
     (id, barcode, name, category_id, supplier_id, buy_price, sell_price, stock, min_stock, unit, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.barcode || null,
      data.name,
      data.category_id || null,
      data.supplier_id || null,
      data.buy_price,
      data.sell_price,
      data.stock || 0,
      data.min_stock || 5,
      data.unit || 'pcs',
      data.image_url || null
    ]
  );

  return exports.getProductById(id);
};

exports.updateProduct = async (id, data) => {
  const existing = await exports.getProductById(id);
  if (!existing) throw new Error('Produk tidak ditemukan');

  if (data.barcode && data.barcode !== existing.barcode) {
    const [dup] = await db.execute(
      'SELECT id FROM products WHERE barcode = ? AND id != ?',
      [data.barcode, id]
    );
    if (dup.length > 0) throw new Error('Barcode sudah digunakan produk lain');
  }

  const fields = [];
  const values = [];

  const updatable = ['barcode', 'name', 'category_id', 'supplier_id', 'buy_price', 'sell_price', 'stock', 'min_stock', 'unit', 'image_url'];
  for (const key of updatable) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return existing;
  values.push(id);

  await db.execute(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return exports.getProductById(id);
};

exports.deleteProduct = async (id) => {
  // Soft delete
  await db.execute('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
};
