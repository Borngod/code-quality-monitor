const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/commits', (req, res) => {
  db.all('SELECT * FROM commits ORDER BY date DESC LIMIT 100', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

router.get('/quality', (req, res) => {
  db.all('SELECT * FROM code_quality ORDER BY commit_hash DESC LIMIT 100', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

module.exports = router;