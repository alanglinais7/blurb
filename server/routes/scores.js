import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Helper to get today's date boundaries in EST
function getTodayBoundsEST() {
  // Get current time in EST
  const now = new Date();
  const estOffset = -5; // EST is UTC-5 (ignoring DST for simplicity, or use -4 for EDT)

  // Create date in EST timezone
  const estNow = new Date(now.getTime() + (now.getTimezoneOffset() + estOffset * 60) * 60000);

  // Start of today in EST
  const startOfDay = new Date(estNow);
  startOfDay.setHours(0, 0, 0, 0);

  // End of today in EST
  const endOfDay = new Date(estNow);
  endOfDay.setHours(23, 59, 59, 999);

  // Convert back to UTC for database queries
  const startUTC = new Date(startOfDay.getTime() - (now.getTimezoneOffset() + estOffset * 60) * 60000);
  const endUTC = new Date(endOfDay.getTime() - (now.getTimezoneOffset() + estOffset * 60) * 60000);

  return {
    start: startUTC.toISOString(),
    end: endUTC.toISOString()
  };
}

// Submit a score (requires auth)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { wpm, accuracy, quoteId } = req.body;
    const userId = req.user.id;

    if (typeof wpm !== 'number' || typeof accuracy !== 'number') {
      return res.status(400).json({ error: 'Invalid score data' });
    }

    if (wpm < 0 || wpm > 300 || accuracy < 0 || accuracy > 100) {
      return res.status(400).json({ error: 'Score values out of range' });
    }

    const result = db.prepare(
      'INSERT INTO scores (user_id, wpm, accuracy, quote_id) VALUES (?, ?, ?, ?)'
    ).run(userId, wpm, accuracy, quoteId || null);

    res.json({
      id: result.lastInsertRowid,
      wpm,
      accuracy,
      message: 'Score submitted successfully'
    });
  } catch (err) {
    console.error('Score submit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get today's leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const { start, end } = getTodayBoundsEST();

    // Get top 10 scores for today, best score per user
    const leaderboard = db.prepare(`
      SELECT
        u.username,
        MAX(s.wpm) as wpm,
        s.accuracy,
        s.played_at
      FROM scores s
      JOIN users u ON s.user_id = u.id
      WHERE s.played_at >= ? AND s.played_at <= ?
      GROUP BY s.user_id
      ORDER BY wpm DESC
      LIMIT 10
    `).all(start, end);

    res.json(leaderboard);
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's scores for today
router.get('/my-scores', authMiddleware, (req, res) => {
  try {
    const { start, end } = getTodayBoundsEST();

    const scores = db.prepare(`
      SELECT wpm, accuracy, played_at
      FROM scores
      WHERE user_id = ? AND played_at >= ? AND played_at <= ?
      ORDER BY played_at DESC
    `).all(req.user.id, start, end);

    // Also get user's best score today
    const best = db.prepare(`
      SELECT MAX(wpm) as bestWpm, MAX(accuracy) as bestAccuracy
      FROM scores
      WHERE user_id = ? AND played_at >= ? AND played_at <= ?
    `).get(req.user.id, start, end);

    res.json({ scores, best });
  } catch (err) {
    console.error('User scores fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's all-time stats
router.get('/my-stats', authMiddleware, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as totalGames,
        AVG(wpm) as avgWpm,
        MAX(wpm) as bestWpm,
        AVG(accuracy) as avgAccuracy
      FROM scores
      WHERE user_id = ?
    `).get(req.user.id);

    res.json(stats);
  } catch (err) {
    console.error('User stats fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
