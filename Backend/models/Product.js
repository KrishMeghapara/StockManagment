const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['piece', 'kg', 'gram', 'liter', 'ml', 'meter', 'cm', 'box', 'pack'],
    default: 'piece'
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  currentStock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock level cannot be negative']
  },
  maxStockLevel: {
    type: Number,
    default: 1000,
    min: [0, 'Maximum stock level cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  hasExpiry: {
    type: Boolean,
    default: false
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
productSchema.index({ name: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ currentStock: 1 });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function() {
  return this.currentStock <= this.minStockLevel;
});

// Auto-generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!this.sku) {
    const timestamp = Date.now().toString().slice(-6);
    const namePrefix = this.name.substring(0, 3).toUpperCase();
    this.sku = `${namePrefix}${timestamp}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);