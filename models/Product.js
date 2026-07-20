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
  // Product Specifications
  specifications: {
    modelNumber: { type: String, trim: true },
    color: { type: String, trim: true },
    weight: { type: String, trim: true },
    dimensions: { type: String, trim: true },
    capacity: { type: String, trim: true },
    power: { type: String, trim: true },
    voltage: { type: String, trim: true },
    warranty: { type: String, trim: true },
    energyRating: { type: String, trim: true },
    material: { type: String, trim: true },
    features: { type: String, trim: true },
    // Additional details
    type: { type: String, trim: true },
    compressorType: { type: String, trim: true },
    refrigerant: { type: String, trim: true },
    noiseLevel: { type: String, trim: true },
    speed: { type: String, trim: true },
    coolingCapacity: { type: String, trim: true },
    tankCapacity: { type: String, trim: true },
    installationType: { type: String, trim: true },
    frequency: { type: String, trim: true },
    countryOfOrigin: { type: String, trim: true },
    certification: { type: String, trim: true },
    inTheBox: { type: String, trim: true }
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
