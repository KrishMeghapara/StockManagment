const express = require('express');
const { body, validationResult } = require('express-validator');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const StockTransaction = require('../models/StockTransaction');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleCheck');

const router = express.Router();

// @route   GET /api/purchases
// @desc    Get all purchases
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      supplier, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filter = {};
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const purchases = await Purchase.find(filter)
      .populate('supplier', 'name contactPerson')
      .populate('createdBy', 'firstName lastName')
      .populate('receivedBy', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Purchase.countDocuments(filter);

    res.json({
      success: true,
      data: {
        purchases,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/purchases/:id
// @desc    Get purchase by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name contactPerson phone email address')
      .populate('items.product', 'name sku unit')
      .populate('createdBy', 'firstName lastName')
      .populate('receivedBy', 'firstName lastName');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.json({
      success: true,
      data: { purchase }
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/purchases
// @desc    Create new purchase order
// @access  Private
router.post('/', [
  auth,
  checkPermission('create'),
  body('supplier').isMongoId().withMessage('Valid supplier ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isFloat({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitCost').isFloat({ min: 0 }).withMessage('Unit cost cannot be negative'),
  body('expectedDeliveryDate').optional().isISO8601().withMessage('Invalid delivery date'),
  body('taxAmount').optional().isFloat({ min: 0 }).withMessage('Tax amount cannot be negative'),
  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount amount cannot be negative')
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

    const { supplier, items, expectedDeliveryDate, taxAmount, discountAmount, notes } = req.body;

    // Validate supplier exists
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(400).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Validate all products exist
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more products not found'
      });
    }

    // Calculate item totals
    const processedItems = items.map(item => ({
      ...item,
      totalCost: item.quantity * item.unitCost
    }));

    // Calculate totals
    const subtotal = processedItems.reduce((sum, item) => sum + item.totalCost, 0);
    const tax = taxAmount || 0;
    const discount = discountAmount || 0;
    const total = subtotal + tax - discount;

    const purchase = new Purchase({
      supplier,
      items: processedItems,
      expectedDeliveryDate,
      subtotal,
      taxAmount: tax,
      discountAmount: discount,
      totalAmount: total,
      notes,
      createdBy: req.user._id
    });

    await purchase.save();
    await purchase.populate('supplier', 'name contactPerson');
    await purchase.populate('items.product', 'name sku unit');
    await purchase.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: { purchase }
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/purchases/:id/receive
// @desc    Receive purchase order items
// @access  Private
router.put('/:id/receive', [
  auth,
  checkPermission('update'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.receivedQuantity').isFloat({ min: 0 }).withMessage('Received quantity cannot be negative')
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

    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchase.status === 'received' || purchase.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Purchase order cannot be modified'
      });
    }

    const { items } = req.body;

    // Update received quantities and stock
    for (const receivedItem of items) {
      const purchaseItem = purchase.items.find(item => 
        item.product.toString() === receivedItem.product
      );

      if (!purchaseItem) {
        return res.status(400).json({
          success: false,
          message: `Product ${receivedItem.product} not found in purchase order`
        });
      }

      const newReceivedQty = receivedItem.receivedQuantity;
      const previousReceivedQty = purchaseItem.receivedQuantity;
      const actualReceived = newReceivedQty - previousReceivedQty;

      if (actualReceived > 0) {
        // Update product stock
        const product = await Product.findById(receivedItem.product);
        const previousStock = product.currentStock;
        product.currentStock += actualReceived;
        await product.save();

        // Create stock transaction
        const stockTransaction = new StockTransaction({
          product: product._id,
          transactionType: 'in',
          reason: 'purchase',
          quantity: actualReceived,
          previousStock,
          newStock: product.currentStock,
          unitCost: purchaseItem.unitCost,
          referenceId: purchase._id,
          referenceModel: 'Purchase',
          createdBy: req.user._id
        });
        await stockTransaction.save();
      }

      // Update purchase item
      purchaseItem.receivedQuantity = newReceivedQty;
      if (receivedItem.expiryDate) {
        purchaseItem.expiryDate = receivedItem.expiryDate;
      }
    }

    // Update purchase status
    const allItemsReceived = purchase.items.every(item => 
      item.receivedQuantity >= item.quantity
    );
    const someItemsReceived = purchase.items.some(item => 
      item.receivedQuantity > 0
    );

    if (allItemsReceived) {
      purchase.status = 'received';
      purchase.receivedDate = new Date();
    } else if (someItemsReceived) {
      purchase.status = 'partially_received';
    }

    purchase.receivedBy = req.user._id;
    await purchase.save();

    await purchase.populate('supplier', 'name contactPerson');
    await purchase.populate('items.product', 'name sku unit');
    await purchase.populate('createdBy', 'firstName lastName');
    await purchase.populate('receivedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Purchase order received successfully',
      data: { purchase }
    });
  } catch (error) {
    console.error('Receive purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/purchases/:id/cancel
// @desc    Cancel purchase order
// @access  Private
router.put('/:id/cancel', [
  auth,
  checkPermission('update')
], async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchase.status === 'received') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a received purchase order'
      });
    }

    if (purchase.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Purchase order is already cancelled'
      });
    }

    purchase.status = 'cancelled';
    await purchase.save();

    res.json({
      success: true,
      message: 'Purchase order cancelled successfully',
      data: { purchase }
    });
  } catch (error) {
    console.error('Cancel purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;