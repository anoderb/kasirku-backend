const db = require('../database');
const { v4: uuidv4 } = require('uuid');

/**
 * Ambil semua transaksi dengan pagination dan filter tanggal
 */
exports.getAllTransactions = async (req) => {
  const { search, date, start_date, end_date, page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  let whereClause = 'WHERE t.status = "completed"';
  const params = [];

  // Filter tanggal spesifik
  if (date) {
    whereClause += ' AND DATE(t.created_at) = ?';
    params.push(date);
  }

  // Filter range tanggal
  if (start_date && end_date) {
    whereClause += ' AND DATE(t.created_at) BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }

  // Search berdasarkan ID atau note
  if (search) {
    whereClause += ' AND (t.id LIKE ? OR t.note LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const [transactions] = await db.query(
    `SELECT t.*, c.name AS customer_name
     FROM transactions t
     LEFT JOIN customers c ON t.customer_id = c.id
     ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT ${limitNum} OFFSET ${skip}`,
    params
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM transactions t ${whereClause}`,
    params
  );

  return {
    items: transactions,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Ambil detail transaksi beserta items-nya
 */
exports.getTransactionById = async (id) => {
  const [rows] = await db.execute(
    `SELECT t.*, c.name AS customer_name
     FROM transactions t
     LEFT JOIN customers c ON t.customer_id = c.id
     WHERE t.id = ?`,
    [id]
  );

  if (!rows[0]) return null;

  const [items] = await db.execute(
    `SELECT ti.*, p.barcode AS current_barcode
     FROM transaction_items ti
     LEFT JOIN products p ON ti.product_id = p.id
     WHERE ti.transaction_id = ?`,
    [id]
  );

  return {
    ...rows[0],
    items
  };
};

/**
 * Buat transaksi baru (atomic: header + items + kurangi stok)
 */
exports.createTransaction = async (data) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const txId = data.id || uuidv4();

    // 1. Insert header transaksi
    await connection.query(
      `INSERT INTO transactions 
       (id, customer_id, cashier_id, total_amount, discount, final_amount,
        payment_method, amount_paid, change_amount, status, note, created_at, is_synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE is_synced = 1`,
      [
        txId, data.customer_id || null, data.cashier_id,
        data.total_amount, data.discount || 0, data.final_amount,
        data.payment_method, data.amount_paid, data.change_amount || 0,
        data.status || 'completed', data.note || null,
        data.created_at || new Date().toISOString()
      ]
    );

    // 2. Insert items & kurangi stok
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const itemId = item.id || uuidv4();
        await connection.query(
          `INSERT INTO transaction_items 
           (id, transaction_id, product_id, product_name, product_barcode, quantity, price, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
          [
            itemId, txId, item.product_id, item.product_name,
            item.product_barcode || null, item.quantity, item.price, item.subtotal
          ]
        );

        // Kurangi stok produk
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    await connection.commit();
    return exports.getTransactionById(txId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
