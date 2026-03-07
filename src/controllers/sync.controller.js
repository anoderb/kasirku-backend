const db = require('../database');

exports.pushSync = async (req, res) => {
  const { queue } = req.body;

  if (!queue || !Array.isArray(queue)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid sync payload. Expected an array of queue items.'
    });
  }

  // We will process each item sequentially to maintain order and easily rollback if needed
  // Alternatively, since items might be independent, we can process them individually and report partial successes.
  // For simplicity and robust offline-first, if one sync fails, we might just fail that one and report to flutter.
  
  const results = [];
  const connection = await db.getConnection();

  try {
    // Start transaction for the whole sync batch (atomic sync)
    // Or we could do transaction per queue item. Transaction per item is safer for partial syncs.
    // Let's do transaction PER queue item so valid transactions push through even if one fails.

    for (const item of queue) {
      const { id: queue_id, entity_type, entity_id, operation, payload } = item;
      
      try {
        await connection.beginTransaction();

        if (entity_type === 'transaction' && operation === 'create') {
          // Payload contains header and items
          const txHeader = typeof payload === 'string' ? JSON.parse(payload) : payload;
          const txItems = txHeader.items || [];

          // 1. Insert Transaction Header
          await connection.query(
            `INSERT INTO transactions 
             (id, customer_id, cashier_id, total_amount, discount, final_amount, 
              payment_method, amount_paid, change_amount, status, note, created_at, is_synced) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE is_synced = 1`,
            [
              txHeader.id, txHeader.customer_id, txHeader.cashier_id, txHeader.total_amount, 
              txHeader.discount, txHeader.final_amount, txHeader.payment_method, txHeader.amount_paid, 
              txHeader.change_amount, txHeader.status, txHeader.note, txHeader.created_at
            ]
          );

          // 2. Insert Transaction Items
          if (txItems && txItems.length > 0) {
            for (const tItem of txItems) {
              await connection.query(
                `INSERT INTO transaction_items 
                 (id, transaction_id, product_id, product_name, product_barcode, quantity, price, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
                [
                  tItem.id, tItem.transaction_id, tItem.product_id, tItem.product_name, 
                  tItem.product_barcode, tItem.quantity, tItem.price, tItem.subtotal
                ]
              );
              
              // 3. Deduct Stock on Server (if we track grand truth stock on server)
              // Note: The mobile app already deducted the stock locally. 
              // We must mirror that deduction on the server.
              await connection.query(
                `UPDATE products SET stock = stock - ? WHERE id = ?`,
                [tItem.quantity, tItem.product_id]
              );
            }
          }
        } else if (entity_type === 'debt' && operation === 'create') {
          const debt = typeof payload === 'string' ? JSON.parse(payload) : payload;
          await connection.query(
            `INSERT INTO debts 
             (id, customer_id, transaction_id, total_amount, paid_amount, remaining_amount, status, note, created_at, updated_at, is_synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE is_synced = 1`,
            [
              debt.id, debt.customer_id, debt.transaction_id, debt.total_amount, debt.paid_amount,
              debt.remaining_amount, debt.status, debt.note, debt.created_at, debt.updated_at
            ]
          );
        }

        await connection.commit();
        results.push({ queue_id, success: true });
      } catch (itemErr) {
        await connection.rollback();
        console.error(`Sync error on queue ${queue_id}:`, itemErr);
        results.push({ queue_id, success: false, error: itemErr.message });
      }
    }

    res.json({
      success: true,
      message: 'Sync processed',
      data: results
    });

  } catch (error) {
    console.error('Push Sync Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing sync payload',
      error: error.message
    });
  } finally {
    connection.release();
  }
};
