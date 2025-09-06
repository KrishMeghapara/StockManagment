const express = require('express');
const { body, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleCheck');

const router = express.Router();

// @route   GET /api/sales
// @desc    Get all sales
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      paymentMethod,
      paymentStatus,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filter = {};
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sales = await Sale.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(filter);

    res.json({
      success: true,
      data: {
        sales,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/sales/:id
// @desc    Get sale by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.product', 'name sku unit')
      .populate('createdBy', 'firstName lastName');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.json({
      success: true,
      data: { sale }
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/sales
// @desc    Create new sale
// @access  Private
router.post('/', [
  auth,
  checkPermission('create'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isFloat({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
  body('items.*.discount').optional().isFloat({ min: 0 }).withMessage('Discount cannot be negative'),
  body('customerName').optional().trim().isLength({ max: 100 }).withMessage('Customer name cannot exceed 100 characters'),
  body('customerPhone').optional().trim(),
  body('customerEmail').optional().isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('taxAmount').optional().isFloat({ min: 0 }).withMessage('Tax amount cannot be negative'),
  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount amount cannot be negative'),
  body('paymentMethod').isIn(['cash', 'card', 'upi', 'bank_transfer', 'credit']).withMessage('Invalid payment method'),
  body('paymentStatus').optional().isIn(['paid', 'partial', 'pending']).withMessage('Invalid payment status'),
  body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount cannot be negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      items, customerName, customerPhone, customerEmail,
      taxAmount, discountAmount, paymentMethod, paymentStatus, paidAmount, notes
    } = req.body;

    // Validate products exist and have sufficient stock
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    
    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more products not found'
      });
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.product);
      if (product.currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Required: ${item.quantity}`
        });
      }
    }

    // Process sale items
    const processedItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.product);
      return {
        ...item,
        unitPrice: item.unitPrice || product.sellingPrice,
        totalPrice: item.quantity * (item.unitPrice || product.sellingPrice),
        discount: item.discount || 0
      };
    });

    const sale = new Sale({
      customerName,
      customerPhone,
      customerEmail,
      items: processedItems,
      taxAmount: taxAmount || 0,
      discountAmount: discountAmount || 0,
      paymentMethod,
      paymentStatus: paymentStatus || 'paid',
      paidAmount: paidAmount || 0,
      notes,
      createdBy: req.user._id
    });

    await sale.save();

    // Update product stocks and create stock transactions
    for (const item of processedItems) {
      const product = products.find(p => p._id.toString() === item.product);
      const previousStock = product.currentStock;
      product.currentStock -= item.quantity;
      await product.save();

      // Create stock transaction
      const stockTransaction = new StockTransaction({
        product: product._id,
        transactionType: 'out',
        reason: 'sale',
        quantity: item.quantity,
        previousStock,
        newStock: product.currentStock,
        unitCost: product.costPrice,
        referenceId: sale._id,
        referenceModel: 'Sale',
        createdBy: req.user._id
      });
      await stockTransaction.save();
    }

    await sale.populate('items.product', 'name sku unit');
    await sale.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: { sale }
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/sales/:id/payment
// @desc    Update payment status
// @access  Private
router.put('/:id/payment', [
  auth,
  checkPermission('update'),
  body('paymentStatus').isIn(['paid', 'partial', 'pending']).withMessage('Invalid payment status'),
  body('paidAmount').isFloat({ min: 0 }).withMessage('Paid amount cannot be negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    const { paymentStatus, paidAmount } = req.body;

    if (paidAmount > sale.totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot exceed total amount'
      });
    }

    sale.paymentStatus = paymentStatus;
    sale.paidAmount = paidAmount;

    await sale.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: { sale }
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/sales/today/summary
// @desc    Get today's sales summary
// @access  Private
router.get('/today/summary', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = await Sale.find({
      saleDate: { $gte: today, $lt: tomorrow }
    });

    const summary = {
      totalSales: todaySales.length,
      totalRevenue: todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      totalProfit: 0,
      cashSales: todaySales.filter(sale => sale.paymentMethod === 'cash').length,
      cardSales: todaySales.filter(sale => sale.paymentMethod === 'card').length,
      upiSales: todaySales.filter(sale => sale.paymentMethod === 'upi').length,
      pendingPayments: todaySales.filter(sale => sale.paymentStatus === 'pending').length
    };

    // Calculate profit
    for (const sale of todaySales) {
      for (const item of sale.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const profit = (item.unitPrice - product.costPrice) * item.quantity - item.discount;
          summary.totalProfit += profit;
        }
      }
    }

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    console.error('Get today summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;