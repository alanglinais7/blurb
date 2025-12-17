import { Router } from 'express';
import db from '../db/schema.js';

const router = Router();

// Get a random quote
router.get('/random', (req, res) => {
  try {
    const quote = db.prepare('SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1').get();
    if (!quote) {
      return res.status(404).json({ error: 'No quotes available' });
    }
    res.json(quote);
  } catch (err) {
    console.error('Quote fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all quotes (for admin/debug)
router.get('/', (req, res) => {
  try {
    const quotes = db.prepare('SELECT * FROM quotes').all();
    res.json(quotes);
  } catch (err) {
    console.error('Quotes fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
