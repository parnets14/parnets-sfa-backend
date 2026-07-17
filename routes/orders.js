const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// Get dashboard stats
router.get('/stats/dashboard', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'Confirmed' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });

    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all orders (with filters)
router.get('/', async (req, res) => {
  try {
    const { dealer, salesperson, status, startDate, endDate } = req.query;
    let query = {};

    if (dealer) query.dealer = dealer;
    if (salesperson) query.salesperson = salesperson;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const orders = await Order.find(query)
      .populate('dealer', 'dealerName phone')
      .populate('salesperson', 'name phone')
      .populate('items.product', 'productName image')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('dealer', 'dealerName phone address')
      .populate('salesperson', 'name phone')
      .populate('items.product', 'productName image mrp billingPrice');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create order (from mobile app)
router.post('/', async (req, res) => {
  try {
    const { dealer, salesperson, items, remarks, paymentTerm } = req.body;

    // Calculate totals
    let totalAmount = 0;
    const processedItems = items.map(item => {
      const price = item.priceUsed === 'special' && item.specialPrice
        ? item.specialPrice
        : item.billingPrice;
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      return {
        ...item,
        subtotal
      };
    });

    const order = new Order({
      dealer,
      salesperson,
      items: processedItems,
      totalAmount,
      remarks,
      paymentTerm
    });

    await order.save();

    // Reduce stock for each product
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    await order.populate('dealer', 'dealerName phone');
    await order.populate('salesperson', 'name phone');

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get the order first to check previous status
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = existingOrder.status;

    // If cancelling, restore stock
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      for (const item of existingOrder.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    // If un-cancelling (restoring from cancelled), reduce stock again
    if (previousStatus === 'Cancelled' && status !== 'Cancelled') {
      for (const item of existingOrder.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      }
    }

    existingOrder.status = status;
    await existingOrder.save();
    await existingOrder.populate('dealer', 'dealerName phone');
    await existingOrder.populate('salesperson', 'name phone');

    res.json(existingOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
