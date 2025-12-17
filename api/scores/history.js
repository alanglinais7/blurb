import { query, initDb } from '../db.js';
import { requireAuth } from '../auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDb();

    const user = requireAuth(req);

    // Get all scores with quote info, grouped by date
    const result = await query(`
      SELECT
        s.wpm,
        s.accuracy,
        s.played_at,
        q.text as quote_text,
        q.source as quote_source
      FROM scores s
      LEFT JOIN quotes q ON s.quote_id = q.id
      WHERE s.user_id = $1
      ORDER BY s.played_at DESC
      LIMIT 100
    `, [user.id]);

    // Get overall stats
    const statsResult = await query(`
      SELECT
        COUNT(*) as total_games,
        MAX(wpm) as best_wpm,
        ROUND(AVG(wpm)) as avg_wpm,
        COUNT(DISTINCT DATE(played_at)) as days_played
      FROM scores
      WHERE user_id = $1
    `, [user.id]);

    res.json({
      scores: result.rows,
      stats: statsResult.rows[0]
    });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
