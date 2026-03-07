const db = require('../database');
const { v4: uuidv4 } = require('uuid');

exports.getAllSuppliers = async () => {
  const [rows] = await db.execute(
    `SELECT * FROM suppliers ORDER BY name ASC`
  );
  return rows;
};

exports.getSupplierById = async (id) => {
  const [rows] = await db.execute(
    `SELECT * FROM suppliers WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.createSupplier = async (data) => {
  const id = data.id || uuidv4();
  
  await db.execute(
    `INSERT INTO suppliers (id, name, phone, address) VALUES (?, ?, ?, ?)`,
    [id, data.name, data.phone || null, data.address || null]
  );
  
  return exports.getSupplierById(id);
};

exports.updateSupplier = async (id, data) => {
  const existing = await exports.getSupplierById(id);
  if (!existing) throw new Error('Supplier tidak ditemukan');

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
    `UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return exports.getSupplierById(id);
};

exports.deleteSupplier = async (id) => {
  const existing = await exports.getSupplierById(id);
  if (!existing) throw new Error('Supplier tidak ditemukan');

  await db.execute(`DELETE FROM suppliers WHERE id = ?`, [id]);
  return true;
};
