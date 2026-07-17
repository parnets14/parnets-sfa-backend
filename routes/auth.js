const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Admin Login (email + password)
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (admin.status === 'inactive') {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mobile App Login (email + password)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role || 'Salesperson'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send OTP to phone number
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this phone number' });
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otp = { code: otp, expiresAt };
    await user.save({ validateModifiedOnly: true });

    // In production, send OTP via SMS service here
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ message: 'OTP sent successfully', phone, otp });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this phone number' });
    }

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ message: 'No OTP was requested. Please send OTP first.' });
    }

    if (new Date() > user.otp.expiresAt) {
      user.otp = { code: null, expiresAt: null };
      await user.save({ validateModifiedOnly: true });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp.code !== otp) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // Clear OTP after successful verification
    user.otp = { code: null, expiresAt: null };
    await user.save({ validateModifiedOnly: true });

    const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role || 'Salesperson'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Seed admin account (one-time setup - remove in production)
router.post('/seed-admin', async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = new Admin({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'Admin@123'
    });

    await admin.save();
    res.json({ message: 'Admin created successfully', email: 'Admin@gmail.com', password: 'Admin@123' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
