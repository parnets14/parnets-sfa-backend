const express = require('express');
const Product = require('../models/Product');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const { search, status, category } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productId: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (category) query.category = category;

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create product
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { productName, category, brand, sku, unit, mrp, billingPrice, stock, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Product image is required' });
    }

    const product = new Product({
      productName,
      image: `/uploads/${req.file.filename}`,
      category: category || '',
      brand: brand || '',
      sku: sku || '',
      unit: unit || 'Pcs',
      mrp: parseFloat(mrp),
      billingPrice: parseFloat(billingPrice),
      stock: stock ? parseInt(stock) : 0,
      description: description || ''
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { productName, category, brand, sku, unit, mrp, billingPrice, stock, description, status } = req.body;

    const updateData = {
      productName,
      category: category || '',
      brand: brand || '',
      sku: sku || '',
      unit: unit || 'Pcs',
      mrp: parseFloat(mrp),
      billingPrice: parseFloat(billingPrice),
      stock: stock ? parseInt(stock) : 0,
      description: description || '',
      status
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle product status
router.patch('/:id/status', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.status = product.status === 'active' ? 'inactive' : 'active';
    await product.save();

    res.json({ message: `Product ${product.status}`, status: product.status });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
