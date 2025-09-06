const express = require('express');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { roles } = require('../config/auth');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');

const router = express.Router();

// @route   GET /api/reports/sales
// @desc    Get sales report data
// @access  Private (Manager+)
router.get('/sales', [
  auth,
  checkRole([roles.OWNER, roles.MANAGER])
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get monthly sales data
    const monthlySales = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sales: { $sum: '$total' },
          profit: { $sum: '$profit' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$_id.month'
            ]
          },
          sales: 1,
          profit: 1,
          count: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        monthlySales
      }
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/inventory
// @desc    Get inventory report data
// @access  Private (Manager+)
router.get('/inventory', [
  auth,
  checkRole([roles.OWNER, roles.MANAGER])
], async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('supplier', 'name');

    const inventoryStats = {
      totalProducts: products.length,
      inStock: products.filter(p => p.currentStock > p.minimumStock).length,
      lowStock: products.filter(p => p.currentStock <= p.minimumStock && p.currentStock > 0).length,
      outOfStock: products.filter(p => p.currentStock === 0).length,
      totalValue: products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0)
    };

    res.json({
      success: true,
      data: {
        inventoryStats,
        products
      }
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/export
// @desc    Export report data
// @access  Private (Manager+)
router.get('/export', [
  auth,
  checkRole([roles.OWNER, roles.MANAGER])
], async (req, res) => {
  try {
    const { format = 'pdf', type = 'overview' } = req.query;
    
    // Mock export - in real implementation, generate actual PDF/Excel files
    const reportData = {
      type,
      generatedAt: new Date(),
      data: 'Mock report data'
    };

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
    } else {
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xlsx"`);
    }

    // Send mock file content
    res.send(JSON.stringify(reportData));
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;