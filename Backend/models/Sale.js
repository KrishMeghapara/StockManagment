const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  }
});

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  customerPhone: {
    type: String,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  items: [saleItemSchema],
  saleDate: {
    type: Date,
    default: Date.now
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'credit'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'pending'],
    default: 'paid'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
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

// Auto-generate invoice number
saleSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Sale').countDocuments();
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `INV${year}${month}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => sum + (item.totalPrice - item.discount), 0);
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  
  next();
});

// Calculate item totals
saleItemSchema.pre('save', function(next) {
  this.totalPrice = this.quantity * this.unitPrice;
  next();
});

module.exports = mongoose.model('Sale', saleSchema);