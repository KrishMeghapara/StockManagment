const express = require('express');
const { body, validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleCheck');

const router = express.Router();

// @route   GET /api/suppliers
// @desc    Get all suppliers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { search, active, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (active) filter.isActive = active === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const suppliers = await Supplier.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Supplier.countDocuments(filter);

    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/suppliers/:id
// @desc    Get supplier by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Get supplier statistics
    const productCount = await Product.countDocuments({ supplier: supplier._id, isActive: true });
    const purchaseCount = await Purchase.countDocuments({ supplier: supplier._id });
    
    // Get recent purchases
    const recentPurchases = await Purchase.find({ supplier: supplier._id })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        supplier: {
          ...supplier.toObject(),
          statistics: {
            productCount,
            purchaseCount
          },
          recentPurchases
        }
      }
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/suppliers
// @desc    Create new supplier
// @access  Private
router.post('/', [
  auth,
  checkPermission('create'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Supplier name must be 1-100 characters'),
  body('phone').matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please enter a valid phone number'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('contactPerson').optional().trim().isLength({ max: 50 }).withMessage('Contact person name cannot exceed 50 characters'),
  body('paymentTerms').optional().isIn(['cash', 'net15', 'net30', 'net45', 'net60']).withMessage('Invalid payment terms'),
  body('creditLimit').optional().isFloat({ min: 0 }).withMessage('Credit limit cannot be negative')
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
      name, contactPerson, email, phone, address, taxId,
      paymentTerms, creditLimit, notes
    } = req.body;

    // Check if supplier already exists
    const existingSupplier = await Supplier.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { phone },
        ...(email ? [{ email }] : [])
      ]
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this name, phone, or email already exists'
      });
    }

    const supplier = new Supplier({
      name,
      contactPerson,
      email,
      phone,
      address,
      taxId,
      paymentTerms,
      creditLimit: creditLimit || 0,
      notes,
      createdBy: req.user._id
    });

    await supplier.save();
    await supplier.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: { supplier }
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/suppliers/:id
// @desc    Update supplier
// @access  Private
router.put('/:id', [
  auth,
  checkPermission('update'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Supplier name must be 1-100 characters'),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please enter a valid phone number'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('contactPerson').optional().trim().isLength({ max: 50 }).withMessage('Contact person name cannot exceed 50 characters'),
  body('paymentTerms').optional().isIn(['cash', 'net15', 'net30', 'net45', 'net60']).withMessage('Invalid payment terms'),
  body('creditLimit').optional().isFloat({ min: 0 }).withMessage('Credit limit cannot be negative'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
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

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const updateFields = req.body;

    // Check for duplicates if name, phone, or email is being updated
    if (updateFields.name || updateFields.phone || updateFields.email) {
      const duplicateCheck = {};
      if (updateFields.name && updateFields.name !== supplier.name) {
        duplicateCheck.name = { $regex: new RegExp(`^${updateFields.name}$`, 'i') };
      }
      if (updateFields.phone && updateFields.phone !== supplier.phone) {
        duplicateCheck.phone = updateFields.phone;
      }
      if (updateFields.email && updateFields.email !== supplier.email) {
        duplicateCheck.email = updateFields.email;
      }

      if (Object.keys(duplicateCheck).length > 0) {
        const existingSupplier = await Supplier.findOne({
          $or: Object.entries(duplicateCheck).map(([key, value]) => ({ [key]: value })),
          _id: { $ne: supplier._id }
        });

        if (existingSupplier) {
          return res.status(400).json({
            success: false,
            message: 'Supplier with this name, phone, or email already exists'
          });
        }
      }
    }

    // Update supplier
    Object.keys(updateFields).forEach(key => {
      if (key === 'address' && updateFields.address) {
        supplier.address = { ...supplier.address, ...updateFields.address };
      } else {
        supplier[key] = updateFields[key];
      }
    });

    await supplier.save();
    await supplier.populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: { supplier }
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/suppliers/:id
// @desc    Delete supplier
// @access  Private
router.delete('/:id', [
  auth,
  checkPermission('delete')
], async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if supplier has products
    const productCount = await Product.countDocuments({ supplier: supplier._id, isActive: true });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier. It has ${productCount} active products associated with it.`
      });
    }

    // Check if supplier has pending purchases
    const pendingPurchases = await Purchase.countDocuments({ 
      supplier: supplier._id, 
      status: { $in: ['pending', 'partially_received'] }
    });
    
    if (pendingPurchases > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier. It has ${pendingPurchases} pending purchase orders.`
      });
    }

    // Soft delete by setting isActive to false
    supplier.isActive = false;
    await supplier.save();

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;