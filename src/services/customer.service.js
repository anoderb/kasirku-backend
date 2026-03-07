const db = require('../database');
const { v4: uuidv4 } = require('uuid');

exports.getAllCustomers = async () => {
  const [rows] = await db.execute(
    `SELECT * FROM customers ORDER BY name ASC`
  );
  return rows;
};

exports.getCustomerById = async (id) => {
  const [rows] = await db.execute(
    `SELECT * FROM customers WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.createCustomer = async (data) => {
  const id = data.id || uuidv4();
  
  await db.execute(
    `INSERT INTO customers (id, name, phone, address) VALUES (?, ?, ?, ?)`,
    [id, data.name, data.phone || null, data.address || null]
  );
  
  return exports.getCustomerById(id);
};

exports.updateCustomer = async (id, data) => {
  const existing = await exports.getCustomerById(id);
  if (!existing) throw new Error('Pelanggan tidak ditemukan');

  const fields = [];
  const values = [];

  const updatable = ['name', 'phone', 'address'];
  for (const key of updatable) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return existing;
  values.push(id);

  await db.execute(
    `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return exports.getCustomerById(id);
};
