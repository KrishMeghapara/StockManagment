const express = require('express');
const { query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const StockTransaction = require('../models/StockTransaction');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/roleCheck');

const router = express.Router();

// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Basic counts
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalSuppliers = await require('../models/Supplier').countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    });

    // Today's sales
    const todaySales = await Sale.find({
      saleDate: { $gte: today, $lt: tomorrow }
    });

    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const todaySalesCount = todaySales.length;

    // This month's data
    const monthSales = await Sale.find({
      saleDate: { $gte: thisMonth, $lt: nextMonth }
    });

    const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Stock value
    const products = await Product.find({ isActive: true });
    const totalStockValue = products.reduce((sum, product) => 
      sum + (product.currentStock * product.costPrice), 0
    );

    // Pending purchases
    const pendingPurchases = await Purchase.countDocuments({
      status: { $in: ['pending', 'partially_received'] }
    });

    // Recent low stock alerts
    const lowStockAlerts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    })
    .populate('category', 'name')
    .sort({ currentStock: 1 })
    .limit(5);

    // Top selling products (this month)
    const topProducts = await Sale.aggregate([
      { $match: { saleDate: { $gte: thisMonth, $lt: nextMonth } } },
      { $unwind: '$items' },
      { 
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          totalSuppliers,
          lowStockProducts,
          pendingPurchases,
          totalStockValue,
          todayRevenue,
          todaySalesCount,
          monthRevenue
        },
        lowStockAlerts,
        topProducts
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/inventory
// @desc    Get inventory report
// @access  Private
router.get('/inventory', [
  auth,
  checkPermission('view_reports'),
  query('category').optional().isMongoId().withMessage('Invalid category ID'),
  query('supplier').optional().isMongoId().withMessage('Invalid supplier ID'),
  query('lowStock').optional().isBoolean().withMessage('lowStock must be boolean')
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

    const { category, supplier, lowStock } = req.query;
    
    let filter = { isActive: true };
    if (category) filter.category = category;
    if (supplier) filter.supplier = supplier;
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ name: 1 });

    const summary = {
      totalProducts: products.length,
      totalStockValue: products.reduce((sum, product) => 
        sum + (product.currentStock * product.costPrice), 0
      ),
      lowStockCount: products.filter(product => 
        product.currentStock <= product.minStockLevel
      ).length,
      outOfStockCount: products.filter(product => 
        product.currentStock === 0
      ).length
    };

    res.json({
      success: true,
      data: {
        products,
        summary
      }
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/sales
// @desc    Get sales report
// @access  Private
router.get('/sales', [
  auth,
  checkPermission('view_reports'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'bank_transfer', 'credit']).withMessage('Invalid payment method')
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

    const { startDate, endDate, paymentMethod } = req.query;
    
    let filter = {};
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(filter)
      .populate('items.product', 'name costPrice')
      .populate('createdBy', 'firstName lastName')
      .sort({ saleDate: -1 });

    let totalRevenue = 0;
    let totalProfit = 0;
    let totalCost = 0;

    for (const sale of sales) {
      totalRevenue += sale.totalAmount;
      
      for (const item of sale.items) {
        if (item.product) {
          const itemCost = item.product.costPrice * item.quantity;
          const itemRevenue = item.totalPrice - item.discount;
          totalCost += itemCost;
          totalProfit += (itemRevenue - itemCost);
        }
      }
    }

    const summary = {
      totalSales: sales.length,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: {
        sales,
        summary
      }
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/purchases
// @desc    Get purchases report
// @access  Private
router.get('/purchases', [
  auth,
  checkPermission('view_reports'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('supplier').optional().isMongoId().withMessage('Invalid supplier ID'),
  query('status').optional().isIn(['pending', 'partially_received', 'received', 'cancelled']).withMessage('Invalid status')
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

    const { startDate, endDate, supplier, status } = req.query;
    
    let filter = {};
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const purchases = await Purchase.find(filter)
      .populate('supplier', 'name contactPerson')
      .populate('createdBy', 'firstName lastName')
      .sort({ orderDate: -1 });

    const summary = {
      totalPurchases: purchases.length,
      totalAmount: purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0),
      pendingCount: purchases.filter(p => p.status === 'pending').length,
      receivedCount: purchases.filter(p => p.status === 'received').length,
      partiallyReceivedCount: purchases.filter(p => p.status === 'partially_received').length,
      cancelledCount: purchases.filter(p => p.status === 'cancelled').length
    };

    res.json({
      success: true,
      data: {
        purchases,
        summary
      }
    });
  } catch (error) {
    console.error('Get purchases report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/profit-loss
// @desc    Get profit and loss report
// @access  Private
router.get('/profit-loss', [
  auth,
  checkPermission('view_reports'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
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

    const { startDate, endDate } = req.query;
    
    let filter = {};
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(filter).populate('items.product', 'costPrice');
    const purchases = await Purchase.find({
      ...filter,
      orderDate: filter.saleDate,
      status: 'received'
    });

    let totalRevenue = 0;
    let totalCOGS = 0; // Cost of Goods Sold
    let totalPurchases = 0;

    // Calculate revenue and COGS from sales
    for (const sale of sales) {
      totalRevenue += sale.totalAmount;
      
      for (const item of sale.items) {
        if (item.product) {
          totalCOGS += item.product.costPrice * item.quantity;
        }
      }
    }

    // Calculate total purchases
    totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit; // Simplified - in real scenario, subtract operating expenses

    const report = {
      revenue: {
        totalSales: sales.length,
        totalRevenue
      },
      costs: {
        totalCOGS,
        totalPurchases
      },
      profit: {
        grossProfit,
        netProfit,
        grossMargin: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0,
        netMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
      }
    };

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('Get profit-loss report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;