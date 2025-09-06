const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const StockTransaction = require('../models/StockTransaction');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleCheck');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      category, 
      supplier, 
      lowStock, 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    let filter = { isActive: true };
    
    if (category) filter.category = category;
    if (supplier) filter.supplier = supplier;
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'name contactPerson')
      .populate('createdBy', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/products/low-stock
// @desc    Get low stock products
// @access  Private
router.get('/low-stock', auth, async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    })
    .populate('category', 'name')
    .populate('supplier', 'name')
    .sort({ currentStock: 1 });

    res.json({
      success: true,
      data: {
        products,
        total: products.length
      }
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .populate('supplier', 'name contactPerson phone email')
      .populate('createdBy', 'firstName lastName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get recent stock transactions
    const stockTransactions = await StockTransaction.find({ product: product._id })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        product: {
          ...product.toObject(),
          recentTransactions: stockTransactions
        }
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', [
  auth,
  checkPermission('create'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Product name must be 1-100 characters'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('supplier').isMongoId().withMessage('Valid supplier ID is required'),
  body('unit').isIn(['piece', 'kg', 'gram', 'liter', 'ml', 'meter', 'cm', 'box', 'pack']).withMessage('Invalid unit'),
  body('costPrice').isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('currentStock').optional().isFloat({ min: 0 }).withMessage('Current stock cannot be negative'),
  body('minStockLevel').optional().isFloat({ min: 0 }).withMessage('Minimum stock level cannot be negative'),
  body('maxStockLevel').optional().isFloat({ min: 0 }).withMessage('Maximum stock level cannot be negative')
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
      name, sku, barcode, category, supplier, unit, costPrice, sellingPrice,
      currentStock, minStockLevel, maxStockLevel, description, hasExpiry
    } = req.body;

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Validate supplier exists
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(400).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check for duplicate SKU or barcode
    const duplicateCheck = {};
    if (sku) duplicateCheck.sku = sku;
    if (barcode) duplicateCheck.barcode = barcode;
    
    if (Object.keys(duplicateCheck).length > 0) {
      const existingProduct = await Product.findOne({
        $or: Object.entries(duplicateCheck).map(([key, value]) => ({ [key]: value }))
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU or barcode already exists'
        });
      }
    }

    const product = new Product({
      name,
      sku,
      barcode,
      category,
      supplier,
      unit,
      costPrice,
      sellingPrice,
      currentStock: currentStock || 0,
      minStockLevel: minStockLevel || 10,
      maxStockLevel: maxStockLevel || 1000,
      description,
      hasExpiry: hasExpiry || false,
      createdBy: req.user._id
    });

    await product.save();

    // Create initial stock transaction if currentStock > 0
    if (product.currentStock > 0) {
      const stockTransaction = new StockTransaction({
        product: product._id,
        transactionType: 'in',
        reason: 'initial_stock',
        quantity: product.currentStock,
        previousStock: 0,
        newStock: product.currentStock,
        unitCost: product.costPrice,
        createdBy: req.user._id
      });
      await stockTransaction.save();
    }

    await product.populate('category', 'name');
    await product.populate('supplier', 'name');
    await product.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', [
  auth,
  checkPermission('update'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Product name must be 1-100 characters'),
  body('category').optional().isMongoId().withMessage('Valid category ID is required'),
  body('supplier').optional().isMongoId().withMessage('Valid supplier ID is required'),
  body('unit').optional().isIn(['piece', 'kg', 'gram', 'liter', 'ml', 'meter', 'cm', 'box', 'pack']).withMessage('Invalid unit'),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('minStockLevel').optional().isFloat({ min: 0 }).withMessage('Minimum stock level cannot be negative'),
  body('maxStockLevel').optional().isFloat({ min: 0 }).withMessage('Maximum stock level cannot be negative')
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

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updateFields = req.body;

    // Validate category if provided
    if (updateFields.category) {
      const categoryExists = await Category.findById(updateFields.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Validate supplier if provided
    if (updateFields.supplier) {
      const supplierExists = await Supplier.findById(updateFields.supplier);
      if (!supplierExists) {
        return res.status(400).json({
          success: false,
          message: 'Supplier not found'
        });
      }
    }

    // Check for duplicate SKU or barcode if being updated
    if (updateFields.sku || updateFields.barcode) {
      const duplicateCheck = {};
      if (updateFields.sku && updateFields.sku !== product.sku) duplicateCheck.sku = updateFields.sku;
      if (updateFields.barcode && updateFields.barcode !== product.barcode) duplicateCheck.barcode = updateFields.barcode;
      
      if (Object.keys(duplicateCheck).length > 0) {
        const existingProduct = await Product.findOne({
          $or: Object.entries(duplicateCheck).map(([key, value]) => ({ [key]: value })),
          _id: { $ne: product._id }
        });

        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'Product with this SKU or barcode already exists'
          });
        }
      }
    }

    // Update product
    Object.keys(updateFields).forEach(key => {
      if (key !== 'currentStock') { // Don't allow direct stock updates
        product[key] = updateFields[key];
      }
    });

    await product.save();
    await product.populate('category', 'name');
    await product.populate('supplier', 'name');
    await product.populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/products/:id/adjust-stock
// @desc    Adjust product stock
// @access  Private
router.post('/:id/adjust-stock', [
  auth,
  checkPermission('update'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('reason').isIn(['damage', 'expired', 'theft', 'correction', 'return']).withMessage('Invalid reason'),
  body('notes').optional().trim().isLength({ max: 200 }).withMessage('Notes cannot exceed 200 characters')
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

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { quantity, reason, notes } = req.body;
    const adjustmentQuantity = parseFloat(quantity);
    const previousStock = product.currentStock;
    const newStock = Math.max(0, previousStock + adjustmentQuantity);

    // Update product stock
    product.currentStock = newStock;
    await product.save();

    // Create stock transaction
    const stockTransaction = new StockTransaction({
      product: product._id,
      transactionType: adjustmentQuantity > 0 ? 'in' : 'out',
      reason,
      quantity: Math.abs(adjustmentQuantity),
      previousStock,
      newStock,
      unitCost: product.costPrice,
      notes,
      createdBy: req.user._id
    });

    await stockTransaction.save();

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        product: {
          id: product._id,
          name: product.name,
          previousStock,
          newStock,
          adjustment: adjustmentQuantity
        },
        transaction: stockTransaction
      }
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', [
  auth,
  checkPermission('delete')
], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;