const db = require('./database');

async function createTables() {
  console.log('Membuat tabel database...');

  // Tabel users
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('owner', 'admin', 'kasir') NOT NULL DEFAULT 'kasir',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Tabel categories
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Tabel suppliers
  await db.execute(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      address TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Tabel products
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      barcode VARCHAR(50) UNIQUE,
      name VARCHAR(200) NOT NULL,
      category_id VARCHAR(36),
      supplier_id VARCHAR(36),
      buy_price DECIMAL(15,2) NOT NULL DEFAULT 0,
      sell_price DECIMAL(15,2) NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      min_stock INT NOT NULL DEFAULT 5,
      unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
      image_url VARCHAR(255),
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_barcode (barcode),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    )
  `);

  // Tabel stock_movements
  await db.execute(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id VARCHAR(36) PRIMARY KEY,
      product_id VARCHAR(36) NOT NULL,
      type ENUM('in', 'out', 'adjustment') NOT NULL,
      quantity INT NOT NULL,
      note TEXT,
      device_id VARCHAR(100),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_product_id (product_id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Tabel customers
  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      address TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Tabel transactions
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(36) PRIMARY KEY,
      customer_id VARCHAR(36),
      cashier_id VARCHAR(36) NOT NULL,
      total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      discount DECIMAL(15,2) NOT NULL DEFAULT 0,
      final_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      payment_method ENUM('cash', 'qris', 'transfer', 'debt') NOT NULL DEFAULT 'cash',
      amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      change_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      status ENUM('completed', 'voided') NOT NULL DEFAULT 'completed',
      note TEXT,
      device_id VARCHAR(100),
      synced_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `);

  // Tabel transaction_items
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transaction_items (
      id VARCHAR(36) PRIMARY KEY,
      transaction_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(36) NOT NULL,
      product_name VARCHAR(200) NOT NULL,
      product_barcode VARCHAR(50),
      quantity INT NOT NULL DEFAULT 1,
      price DECIMAL(15,2) NOT NULL DEFAULT 0,
      subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
      INDEX idx_transaction_id (transaction_id),
      INDEX idx_product_id (product_id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Tabel debts
  await db.execute(`
    CREATE TABLE IF NOT EXISTS debts (
      id VARCHAR(36) PRIMARY KEY,
      customer_id VARCHAR(36) NOT NULL,
      transaction_id VARCHAR(36),
      total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      remaining_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      status ENUM('unpaid', 'partial', 'paid') NOT NULL DEFAULT 'unpaid',
      note TEXT,
      due_date DATETIME,
      device_id VARCHAR(100),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  // Tabel debt_payments
  await db.execute(`
    CREATE TABLE IF NOT EXISTS debt_payments (
      id VARCHAR(36) PRIMARY KEY,
      debt_id VARCHAR(36) NOT NULL,
      amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      payment_method VARCHAR(50) NOT NULL,
      note TEXT,
      device_id VARCHAR(100),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (debt_id) REFERENCES debts(id)
    )
  `);

  // Tabel sync_queue (untuk data offline yg belum terkirim)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id VARCHAR(36) PRIMARY KEY,
      device_id VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(36) NOT NULL,
      operation ENUM('create', 'update', 'delete') NOT NULL,
      payload JSON NOT NULL,
      status ENUM('pending', 'synced', 'failed') NOT NULL DEFAULT 'pending',
      retry_count INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      synced_at DATETIME,
      INDEX idx_status (status)
    )
  `);

  console.log('Semua tabel berhasil dibuat!');
}

module.exports = { createTables };
