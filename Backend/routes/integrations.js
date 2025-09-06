const express = require('express');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { roles } = require('../config/auth');

const router = express.Router();

// @route   GET /api/integrations/barcode/:barcode
// @desc    Find product by barcode
// @access  Private
router.get('/barcode/:barcode', auth, async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const product = await Product.findOne({ barcode })
      .populate('category', 'name')
      .populate('supplier', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/integrations/accounting/export
// @desc    Export data for accounting software
// @access  Private (Owner/Manager only)
router.post('/accounting/export', [auth, checkRole([roles.OWNER, roles.MANAGER])], async (req, res) => {
  try {
    const { startDate, endDate, format = 'quickbooks' } = req.body;
    
    let filter = {};
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(filter)
      .populate('items.product', 'name costPrice')
      .populate('createdBy', 'firstName lastName');

    let exportData;
    
    switch (format) {
      case 'quickbooks':
        exportData = sales.map(sale => ({
          Date: sale.saleDate.toISOString().split('T')[0],
          'Invoice Number': sale.invoiceNumber,
          Customer: sale.customerName || 'Walk-in Customer',
          'Total Amount': sale.totalAmount,
          'Tax Amount': sale.taxAmount || 0,
          'Payment Method': sale.paymentMethod,
          Items: sale.items.map(item => ({
            Product: item.product?.name || 'Unknown',
            Quantity: item.quantity,
            'Unit Price': item.unitPrice,
            Total: item.totalPrice
          }))
        }));
        break;
        
      case 'xero':
        exportData = sales.map(sale => ({
          '*ContactName': sale.customerName || 'Walk-in Customer',
          '*InvoiceNumber': sale.invoiceNumber,
          '*InvoiceDate': sale.saleDate.toISOString().split('T')[0],
          '*DueDate': sale.saleDate.toISOString().split('T')[0],
          'Description': `Sale - ${sale.items.length} items`,
          '*Quantity': sale.items.reduce((sum, item) => sum + item.quantity, 0),
          '*UnitAmount': sale.totalAmount,
          '*AccountCode': '200', // Sales account
          '*TaxType': 'OUTPUT'
        }));
        break;
        
      default:
        exportData = sales;
    }

    res.json({
      success: true,
      data: {
        format,
        records: exportData.length,
        data: exportData
      }
    });
  } catch (error) {
    console.error('Accounting export error:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed'
    });
  }
});

// @route   GET /api/integrations/expiry-alerts
// @desc    Get products nearing expiry
// @access  Private
router.get('/expiry-alerts', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + parseInt(days));

    const expiringProducts = await Product.find({
      expiryDate: { $lte: alertDate, $gte: new Date() },
      isActive: true
    })
    .populate('category', 'name')
    .populate('supplier', 'name')
    .sort({ expiryDate: 1 });

    const expiredProducts = await Product.find({
      expiryDate: { $lt: new Date() },
      isActive: true
    })
    .populate('category', 'name')
    .populate('supplier', 'name')
    .sort({ expiryDate: 1 });

    res.json({
      success: true,
      data: {
        expiring: expiringProducts,
        expired: expiredProducts,
        alertDays: days
      }
    });
  } catch (error) {
    console.error('Expiry alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/integrations/batch-update
// @desc    Update product batch information
// @access  Private
router.post('/batch-update', auth, async (req, res) => {
  try {
    const { productId, batches } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.batches = batches;
    product.trackBatches = true;
    
    // Update total stock from batches
    product.currentStock = batches.reduce((total, batch) => total + batch.quantity, 0);
    
    await product.save();

    res.json({
      success: true,
      message: 'Batch information updated',
      data: { product }
    });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;