const mysql = require('mysql2/promise');

// Pool koneksi MySQL - lebih efisien dari single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'kasirku',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test koneksi awal
pool.getConnection()
  .then(conn => {
    console.log('MySQL terkoneksi!');
    conn.release();
  })
  .catch(err => {
    console.error('Gagal koneksi MySQL:', err.message);
  });

module.exports = pool;
