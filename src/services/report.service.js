const db = require('../database');

/**
 * Ringkasan penjualan harian
 * @param {string} date - format YYYY-MM-DD
 */
exports.getDailySummary = async (date) => {
  // Total omzet & jumlah transaksi
  const [[summary]] = await db.execute(
    `SELECT 
       COUNT(*) AS total_transactions,
       COALESCE(SUM(final_amount), 0) AS total_revenue,
       COALESCE(AVG(final_amount), 0) AS avg_transaction
     FROM transactions 
     WHERE DATE(created_at) = ? AND status = 'completed'`,
    [date]
  );

  // Breakdown per metode pembayaran
  const [paymentBreakdown] = await db.execute(
    `SELECT 
       payment_method,
       COUNT(*) AS count,
       COALESCE(SUM(final_amount), 0) AS total
     FROM transactions 
     WHERE DATE(created_at) = ? AND status = 'completed'
     GROUP BY payment_method`,
    [date]
  );

  return {
    date,
    ...summary,
    payment_breakdown: paymentBreakdown
  };
};

/**
 * Ringkasan penjualan berdasarkan range tanggal
 * @param {string} startDate - format YYYY-MM-DD
 * @param {string} endDate - format YYYY-MM-DD
 */
exports.getRangeSummary = async (startDate, endDate) => {
  const [[summary]] = await db.execute(
    `SELECT 
       COUNT(*) AS total_transactions,
       COALESCE(SUM(final_amount), 0) AS total_revenue,
       COALESCE(AVG(final_amount), 0) AS avg_transaction,
       COALESCE(SUM(discount), 0) AS total_discount
     FROM transactions 
     WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'`,
    [startDate, endDate]
  );

  const [paymentBreakdown] = await db.execute(
    `SELECT 
       payment_method,
       COUNT(*) AS count,
       COALESCE(SUM(final_amount), 0) AS total
     FROM transactions 
     WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'
     GROUP BY payment_method`,
    [startDate, endDate]
  );

  return {
    start_date: startDate,
    end_date: endDate,
    ...summary,
    payment_breakdown: paymentBreakdown
  };
};

/**
 * Produk terlaris berdasarkan jumlah terjual
 * @param {string} startDate
 * @param {string} endDate
 * @param {number} limit - default 10
 */
exports.getTopProducts = async (startDate, endDate, limit = 10) => {
  const limitNum = parseInt(limit);
  const [products] = await db.query(
    `SELECT 
       ti.product_id,
       ti.product_name,
       ti.product_barcode,
       SUM(ti.quantity) AS total_sold,
       SUM(ti.subtotal) AS total_revenue
     FROM transaction_items ti
     JOIN transactions t ON ti.transaction_id = t.id
     WHERE DATE(t.created_at) BETWEEN ? AND ? AND t.status = 'completed'
     GROUP BY ti.product_id, ti.product_name, ti.product_barcode
     ORDER BY total_sold DESC
     LIMIT ${limitNum}`,
    [startDate, endDate]
  );

  return products;
};

/**
 * Data chart penjualan per hari (untuk grafik garis/bar)
 * @param {string} startDate
 * @param {string} endDate
 */
exports.getSalesChart = async (startDate, endDate) => {
  const [chartData] = await db.execute(
    `SELECT 
       DATE(created_at) AS date,
       COUNT(*) AS total_transactions,
       COALESCE(SUM(final_amount), 0) AS total_revenue
     FROM transactions 
     WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'
     GROUP BY DATE(created_at)
     ORDER BY DATE(created_at) ASC`,
    [startDate, endDate]
  );

  return chartData;
};
