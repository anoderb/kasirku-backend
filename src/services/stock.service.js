const db = require('../database');
const { v4: uuidv4 } = require('uuid');

exports.getLowStockProducts = async () => {
  const [rows] = await db.execute(
    `SELECT p.*, c.name AS category_name, s.name AS supplier_name 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE p.stock <= p.min_stock AND p.is_active = 1
     ORDER BY p.stock ASC`
  );
  return rows;
};

exports.getRecentMovements = async (page = 1, limit = 20) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [rows] = await db.execute(
    `SELECT sm.*, p.name AS product_name, p.barcode 
     FROM stock_movements sm
     JOIN products p ON sm.product_id = p.id
     ORDER BY sm.created_at DESC
     LIMIT ? OFFSET ?`,
    [parseInt(limit), skip]
  );

  const [[{ total }]] = await db.execute(
    `SELECT COUNT(*) AS total FROM stock_movements`
  );

  return {
    items: rows,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

exports.restockProduct = async (data) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const movementId = uuidv4();
    const qty = parseInt(data.quantity);
    if(qty <= 0) throw new Error('Kuantitas restock harus lebih dari 0');

    // 1. Insert ke stock_movements
    await connection.execute(
      `INSERT INTO stock_movements 
       (id, product_id, type, quantity, note, device_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        movementId,
        data.product_id,
        'in',
        qty,
        data.note || 'Restock manual',
        data.device_id || null
      ]
    );

    // 2. Update stok di products table
    await connection.execute(
      `UPDATE products SET stock = stock + ? WHERE id = ?`,
      [qty, data.product_id]
    );

    // Dapatkan data produk terbaru
    const [rows] = await connection.execute(
      `SELECT * FROM products WHERE id = ?`,
      [data.product_id]
    );

    await connection.commit();
    return rows[0];

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
