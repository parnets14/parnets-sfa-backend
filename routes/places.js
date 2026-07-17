const express = require('express');
const router = express.Router();

// Google Places Autocomplete proxy
router.get('/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) return res.json([]);

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:in&key=${process.env.GOOGLE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      res.json(data.predictions.map(p => ({
        placeId: p.place_id,
        description: p.description,
      })));
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get place details (full address)
router.get('/details', async (req, res) => {
  try {
    const { placeId } = req.query;
    if (!placeId) return res.json({});

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,address_components,geometry&key=${process.env.GOOGLE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      const result = data.result;
      const components = result.address_components || [];

      const getComponent = (type) => {
        const c = components.find(c => c.types.includes(type));
        return c ? c.long_name : '';
      };

      res.json({
        address: result.formatted_address,
        city: getComponent('locality') || getComponent('administrative_area_level_2'),
        state: getComponent('administrative_area_level_1'),
        pincode: getComponent('postal_code'),
        lat: result.geometry?.location?.lat,
        lng: result.geometry?.location?.lng,
      });
    } else {
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
