const mysql = require('mysql2');

console.log('Mencoba koneksi ke MySQL Laragon...');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // default Laragon
  database: 'kasirku'
});

connection.connect((err) => {
  if (err) {
    console.error('\n❌ KONEKSI GAGAL!');
    console.error('Pesan Error:', err.message);
    console.error('\nPastikan:');
    console.error('1. Servis MySQL di Laragon sudah dalam keadaan START');
    console.error('2. Database bernama "kasirku" benar-benar sudah dibuat di HeidiSQL');
  } else {
    console.log('\n✅ KONEKSI BERHASIL!');
    console.log('Database "kasirku" ditemukan dan siap digunakan oleh aplikasi kita.');
  }
  process.exit();
});
