const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleCheck');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { parent, active } = req.query;
    let filter = {};
    
    if (parent) filter.parentCategory = parent === 'null' ? null : parent;
    if (active) filter.isActive = active === 'true';

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        categories,
        total: categories.length
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'firstName lastName');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get subcategories
    const subcategories = await Category.find({ parentCategory: category._id });
    
    // Get product count
    const productCount = await Product.countDocuments({ category: category._id });

    res.json({
      success: true,
      data: {
        category: {
          ...category.toObject(),
          subcategories,
          productCount
        }
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private
router.post('/', [
  auth,
  checkPermission('create'),
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Category name must be 1-50 characters'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  body('parentCategory').optional().isMongoId().withMessage('Invalid parent category ID')
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

    const { name, description, parentCategory } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Validate parent category if provided
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    const category = new Category({
      name,
      description,
      parentCategory: parentCategory || null,
      createdBy: req.user._id
    });

    await category.save();
    await category.populate('parentCategory', 'name');
    await category.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private
router.put('/:id', [
  auth,
  checkPermission('update'),
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Category name must be 1-50 characters'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  body('parentCategory').optional().isMongoId().withMessage('Invalid parent category ID'),
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

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, description, parentCategory, isActive } = req.body;

    // Check for duplicate name if name is being updated
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: category._id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Validate parent category
    if (parentCategory && parentCategory !== category.parentCategory?.toString()) {
      if (parentCategory === category._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }

      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (typeof isActive === 'boolean') category.isActive = isActive;

    await category.save();
    await category.populate('parentCategory', 'name');
    await category.populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private
router.delete('/:id', [
  auth,
  checkPermission('delete')
], async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productCount} products associated with it.`
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parentCategory: category._id });
    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${subcategoryCount} subcategories.`
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;