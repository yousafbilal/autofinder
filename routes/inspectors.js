const express = require('express');
const router = express.Router();
const Inspector = require('../models/Dashboard/Inspector');

// List inspectors
router.get('/', async (_req, res) => {
  try {
    const inspectors = await Inspector.find({}).sort({ createdAt: -1 });
    res.json(inspectors);
  } catch (e) {
    console.error('List inspectors error:', e);
    res.status(500).json({ message: 'Failed to fetch inspectors' });
  }
});

module.exports = router;


