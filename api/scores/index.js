import { query, initDb } from '../db.js';
import { requireAuth } from '../auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDb();

    const user = requireAuth(req);
    const { wpm, accuracy, quoteId } = req.body;

    if (typeof wpm !== 'number' || typeof accuracy !== 'number') {
      return res.status(400).json({ error: 'Invalid score data' });
    }

    if (wpm < 0 || wpm > 300 || accuracy < 0 || accuracy > 100) {
      return res.status(400).json({ error: 'Score values out of range' });
    }

    const result = await query(
      'INSERT INTO scores (user_id, wpm, accuracy, quote_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [user.id, wpm, accuracy, quoteId || null]
    );

    res.json({
      id: result.rows[0].id,
      wpm,
      accuracy,
      message: 'Score submitted successfully'
    });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.error('Score submit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
