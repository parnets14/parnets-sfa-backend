const express = require('express');
const Dealer = require('../models/Dealer');

const router = express.Router();

// Get all dealers
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { dealerName: { $regex: search, $options: 'i' } },
        { dealerId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const dealers = await Dealer.find(query)
      .populate('createdBy', 'name phone')
      .sort({ createdAt: -1 });
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single dealer
router.get('/:id', async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id).populate('createdBy', 'name phone');
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }
    res.json(dealer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create dealer
router.post('/', async (req, res) => {
  try {
    const {
      dealerName, contactPerson, phone, alternatePhone, email,
      gstNumber, panNumber, businessType, address, city, state,
      pincode, creditLimit, paymentTerms, notes
    } = req.body;

    const dealer = new Dealer({
      dealerName,
      contactPerson: contactPerson || '',
      phone,
      alternatePhone: alternatePhone || '',
      email: email || '',
      gstNumber: gstNumber || '',
      panNumber: panNumber || '',
      businessType: businessType || '',
      address,
      city: city || '',
      state: state || '',
      pincode: pincode || '',
      creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
      paymentTerms: paymentTerms || '',
      notes: notes || ''
    });

    await dealer.save();
    res.status(201).json(dealer);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update dealer
router.put('/:id', async (req, res) => {
  try {
    const {
      dealerName, contactPerson, phone, alternatePhone, email,
      gstNumber, panNumber, businessType, address, city, state,
      pincode, creditLimit, paymentTerms, notes, status
    } = req.body;

    const dealer = await Dealer.findByIdAndUpdate(
      req.params.id,
      {
        dealerName, contactPerson, phone, alternatePhone, email,
        gstNumber, panNumber, businessType, address, city, state,
        pincode, creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
        paymentTerms, notes, status
      },
      { new: true, runValidators: true }
    );

    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    res.json(dealer);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle dealer status
router.patch('/:id/status', async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    dealer.status = dealer.status === 'active' ? 'inactive' : 'active';
    await dealer.save();

    res.json({ message: `Dealer ${dealer.status}`, status: dealer.status });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete dealer
router.delete('/:id', async (req, res) => {
  try {
    const dealer = await Dealer.findByIdAndDelete(req.params.id);
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }
    res.json({ message: 'Dealer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
