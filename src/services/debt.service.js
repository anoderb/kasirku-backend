const db = require('../database');
const { v4: uuidv4 } = require('uuid');

exports.getDebtsByCustomer = async (customerId) => {
  const [rows] = await db.execute(
    `SELECT * FROM debts WHERE customer_id = ? ORDER BY created_at DESC`,
    [customerId]
  );
  return rows;
};

exports.getAllDebtsSummary = async () => {
  const [rows] = await db.execute(`
    SELECT 
      c.id as customer_id, 
      c.name as customer_name,
      c.phone as customer_phone,
      SUM(d.remaining_amount) as total_remaining_debt
    FROM customers c
    JOIN debts d ON c.id = d.customer_id
    WHERE d.status IN ('unpaid', 'partial') AND d.remaining_amount > 0
    GROUP BY c.id, c.name, c.phone
    ORDER BY total_remaining_debt DESC
  `);
  return rows;
};

exports.getDebtById = async (id) => {
  const [rows] = await db.execute(
    `SELECT * FROM debts WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.createDebt = async (data) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const debtId = data.id || uuidv4();
    const total = parseFloat(data.total_amount);
    
    await connection.execute(
      `INSERT INTO debts 
       (id, customer_id, transaction_id, total_amount, paid_amount, remaining_amount, status, note, due_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        debtId,
        data.customer_id,
        data.transaction_id || null,
        total,
        0, // paid_amount
        total, // remaining_amount
        'unpaid', // status
        data.note || 'Transaksi Kasbon',
        data.due_date || null
      ]
    );

    const [rows] = await connection.execute(
      `SELECT * FROM debts WHERE id = ?`,
      [debtId]
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

exports.payDebt = async (debtId, data) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [debts] = await connection.execute(
      `SELECT * FROM debts WHERE id = ? FOR UPDATE`,
      [debtId]
    );
    
    if (debts.length === 0) throw new Error('Hutang tidak ditemukan');
    const debt = debts[0];
    
    const paymentAmount = parseFloat(data.amount);
    if (paymentAmount <= 0) throw new Error('Nominal pelunasan tidak valid');
    if (paymentAmount > debt.remaining_amount) throw new Error('Nominal pelunasan melebihi sisa hutang');

    // 1. Simpan history pembayaran
    const paymentId = uuidv4();
    await connection.execute(
      `INSERT INTO debt_payments (id, debt_id, amount, payment_method, note, device_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        debtId,
        paymentAmount,
        data.payment_method || 'cash',
        data.note || 'Pembayaran Hutang',
        data.device_id || null
      ]
    );

    // 2. Update saldo hutang
    const newPaidAmount = parseFloat(debt.paid_amount) + paymentAmount;
    const newRemainingAmount = parseFloat(debt.total_amount) - newPaidAmount;
    
    let newStatus = debt.status;
    if (newRemainingAmount <= 0) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    }

    await connection.execute(
      `UPDATE debts 
       SET paid_amount = ?, remaining_amount = ?, status = ?
       WHERE id = ?`,
      [newPaidAmount, newRemainingAmount, newStatus, debtId]
    );

    const [updatedDebts] = await connection.execute(
      `SELECT * FROM debts WHERE id = ?`,
      [debtId]
    );

    await connection.commit();
    return updatedDebts[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
