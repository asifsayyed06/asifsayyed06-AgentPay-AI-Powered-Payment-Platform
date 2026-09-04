const express = require('express');
const db = require('../data/db');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ merchants: db.getAll('merchants') });
});

module.exports = router;
