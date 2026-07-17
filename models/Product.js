const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
  category: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    trim: true,
    default: 'Pcs'
  },
  mrp: {
    type: Number,
    required: [true, 'MRP is required'],
    min: 0
  },
  billingPrice: {
    type: Number,
    required: [true, 'Billing price is required'],
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

// Auto-generate product ID
productSchema.pre('save', async function() {
  if (!this.productId) {
    const count = await mongoose.model('Product').countDocuments();
    this.productId = `PRD-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Product', productSchema);
