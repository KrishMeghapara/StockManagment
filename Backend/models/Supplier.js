const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Supplier name cannot exceed 100 characters']
  },
  contactPerson: {
    type: String,
    trim: true,
    maxlength: [50, 'Contact person name cannot exceed 50 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[\+]?[0-9][\d]{0,15}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    }
  },
  taxId: {
    type: String,
    trim: true,
    uppercase: true
  },
  paymentTerms: {
    type: String,
    enum: ['cash', 'net15', 'net30', 'net45', 'net60'],
    default: 'net30'
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative']
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
supplierSchema.index({ name: 1 });
supplierSchema.index({ email: 1 }, { sparse: true });
supplierSchema.index({ phone: 1 }, { sparse: true });

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean);
  return parts.join(', ');
});

module.exports = mongoose.model('Supplier', supplierSchema);