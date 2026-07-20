const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    // Sync indexes - removes old unique indexes that no longer exist in schema
    try {
      const User = require('./models/User');
      const Product = require('./models/Product');
      const Dealer = require('./models/Dealer');
      await User.syncIndexes();
      await Product.syncIndexes();
      await Dealer.syncIndexes();
      console.log('All indexes synced');
    } catch (e) {
      console.log('Index sync note:', e.message);
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dealers', require('./routes/dealers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/places', require('./routes/places'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dealer Order Management API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
