const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  transactionType: {
    type: String,
    enum: ['in', 'out', 'adjustment'],
    required: [true, 'Transaction type is required']
  },
  reason: {
    type: String,
    enum: [
      'purchase', 'sale', 'return', 'damage', 'expired', 
      'theft', 'correction', 'transfer', 'initial_stock'
    ],
    required: [true, 'Reason is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required']
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  unitCost: {
    type: Number,
    min: [0, 'Unit cost cannot be negative']
  },
  totalValue: {
    type: Number
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Purchase', 'Sale']
  },
  batchNumber: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
stockTransactionSchema.index({ product: 1, createdAt: -1 });
stockTransactionSchema.index({ transactionType: 1 });
stockTransactionSchema.index({ reason: 1 });
stockTransactionSchema.index({ createdAt: -1 });

// Calculate total value before saving
stockTransactionSchema.pre('save', function(next) {
  if (this.unitCost) {
    this.totalValue = Math.abs(this.quantity) * this.unitCost;
  }
  next();
});

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);