const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema({
  dealerId: {
    type: String,
    unique: true
  },
  dealerName: {
    type: String,
    required: [true, 'Dealer name is required'],
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  gstNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
      },
      message: 'Invalid GST number format'
    }
  },
  panNumber: {
    type: String,
    trim: true
  },
  businessType: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Auto-generate dealer ID before saving
dealerSchema.pre('save', async function() {
  if (!this.dealerId) {
    const count = await mongoose.model('Dealer').countDocuments();
    this.dealerId = `DLR-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Dealer', dealerSchema);
