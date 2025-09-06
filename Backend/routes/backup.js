const express = require('express');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const multer = require('multer');
const csv = require('csv-parser');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { roles } = require('../config/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// @route   GET /api/backup/export/products
// @desc    Export products to CSV
// @access  Private (Owner/Manager only)
router.get('/export/products', auth, checkRole([roles.OWNER, roles.MANAGER]), async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('supplier', 'name')
      .lean();

    const csvData = products.map(product => ({
      name: product.name,
      sku: product.sku,
      category: product.category?.name || '',
      supplier: product.supplier?.name || '',
      description: product.description || '',
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      currentStock: product.currentStock,
      minStockLevel: product.minStockLevel,
      maxStockLevel: product.maxStockLevel,
      unit: product.unit,
      barcode: product.barcode || '',
      expiryDate: product.expiryDate || '',
      batchNumber: product.batchNumber || '',
      isActive: product.isActive
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export products error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// @route   POST /api/backup/import/products
// @desc    Import products from CSV
// @access  Private (Owner/Manager only)
router.post('/import/products', auth, checkRole([roles.OWNER, roles.MANAGER]), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let imported = 0;
        
        for (const row of results) {
          try {
            // Find or create category
            let category = null;
            if (row.category) {
              category = await Category.findOne({ name: row.category });
              if (!category) {
                category = new Category({ name: row.category, createdBy: req.user._id });
                await category.save();
              }
            }

            // Find or create supplier
            let supplier = null;
            if (row.supplier) {
              supplier = await Supplier.findOne({ name: row.supplier });
              if (!supplier) {
                supplier = new Supplier({ name: row.supplier, createdBy: req.user._id });
                await supplier.save();
              }
            }

            const product = new Product({
              name: row.name,
              sku: row.sku,
              category: category?._id,
              supplier: supplier?._id,
              description: row.description,
              costPrice: parseFloat(row.costPrice) || 0,
              sellingPrice: parseFloat(row.sellingPrice) || 0,
              currentStock: parseInt(row.currentStock) || 0,
              minStockLevel: parseInt(row.minStockLevel) || 0,
              maxStockLevel: parseInt(row.maxStockLevel) || 100,
              unit: row.unit || 'pcs',
              barcode: row.barcode,
              expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
              batchNumber: row.batchNumber,
              isActive: row.isActive !== 'false',
              createdBy: req.user._id
            });

            await product.save();
            imported++;
          } catch (error) {
            errors.push(`Row ${results.indexOf(row) + 1}: ${error.message}`);
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          message: `Import completed. ${imported} products imported.`,
          data: { imported, errors }
        });
      });
  } catch (error) {
    console.error('Import products error:', error);
    res.status(500).json({ success: false, message: 'Import failed' });
  }
});

// @route   GET /api/backup/export/full
// @desc    Export full database backup
// @access  Private (Owner only)
router.get('/export/full', auth, checkRole([roles.OWNER]), async (req, res) => {
  try {
    const [products, sales, purchases, suppliers, categories] = await Promise.all([
      Product.find().populate('category supplier').lean(),
      Sale.find().populate('items.product createdBy').lean(),
      Purchase.find().populate('supplier createdBy').lean(),
      Supplier.find().lean(),
      Category.find().lean()
    ]);

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        products,
        sales,
        purchases,
        suppliers,
        categories
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=backup.json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (error) {
    console.error('Full backup error:', error);
    res.status(500).json({ success: false, message: 'Backup failed' });
  }
});

module.exports = router;