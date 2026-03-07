const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json());
// Enable CORS
app.use(cors());

// Mount routers
app.use('/auth', require('./src/routes/auth.routes'));
app.use('/products', require('./src/routes/product.routes'));
app.use('/stock', require('./src/routes/stock.routes'));
app.use('/customers', require('./src/routes/customer.routes'));
app.use('/suppliers', require('./src/routes/supplier.routes'));
app.use('/debts', require('./src/routes/debt.routes'));
// app.use('/transactions', require('./src/routes/transaction.routes'));
app.use('/sync', require('./src/routes/sync.routes'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to KasirKu API v1.0.0' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
