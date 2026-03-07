const db = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'kasirku_secret';

exports.login = async (username, password) => {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE username = ? AND is_active = 1',
    [username]
  );

  const user = rows[0];
  if (!user) throw new Error('Username tidak ditemukan atau akun tidak aktif');

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('Password salah');

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: { id: user.id, name: user.name, username: user.username, role: user.role },
    token
  };
};

exports.registerInitialOwner = async (data) => {
  const [[{ count }]] = await db.execute('SELECT COUNT(*) AS count FROM users');
  if (count > 0) throw new Error('Inisialisasi hanya bisa dilakukan saat database kosong');

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const id = uuidv4();

  await db.execute(
    'INSERT INTO users (id, name, username, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [id, data.name || 'Owner', data.username, hashedPassword, 'owner']
  );

  return exports.login(data.username, data.password);
};
