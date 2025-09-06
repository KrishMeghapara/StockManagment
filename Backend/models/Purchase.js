const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
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
  unitCost: {
    type: Number,
    required: [true, 'Unit cost is required'],
    min: [0, 'Unit cost cannot be negative']
  },
  totalCost: {
    type: Number,
    required: true
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Received quantity cannot be negative']
  },
  expiryDate: {
    type: Date
  }
});

const purchaseSchema = new mongoose.Schema({
  purchaseOrderNumber: {
    type: String,
    unique: true,
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  items: [purchaseItemSchema],
  status: {
    type: String,
    enum: ['pending', 'partially_received', 'received', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  receivedDate: {
    type: Date
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
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate purchase order number
purchaseSchema.pre('save', async function(next) {
  if (!this.purchaseOrderNumber) {
    const count = await mongoose.model('Purchase').countDocuments();
    this.purchaseOrderNumber = `PO${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalCost, 0);
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  
  next();
});

// Calculate item totals before saving
purchaseItemSchema.pre('save', function(next) {
  this.totalCost = this.quantity * this.unitCost;
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);