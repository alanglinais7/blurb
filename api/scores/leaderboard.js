import { query, initDb } from '../db.js';

function getTodayBoundsEST() {
  const now = new Date();
  const estOffset = -5;

  const estNow = new Date(now.getTime() + (now.getTimezoneOffset() + estOffset * 60) * 60000);

  const startOfDay = new Date(estNow);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(estNow);
  endOfDay.setHours(23, 59, 59, 999);

  const startUTC = new Date(startOfDay.getTime() - (now.getTimezoneOffset() + estOffset * 60) * 60000);
  const endUTC = new Date(endOfDay.getTime() - (now.getTimezoneOffset() + estOffset * 60) * 60000);

  return {
    start: startUTC.toISOString(),
    end: endUTC.toISOString()
  };
}

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

    const { start, end } = getTodayBoundsEST();

    const result = await query(`
      SELECT
        u.username,
        MAX(s.wpm) as wpm,
        s.accuracy,
        s.played_at
      FROM scores s
      JOIN users u ON s.user_id = u.id
      WHERE s.played_at >= $1 AND s.played_at <= $2
      GROUP BY u.username, s.accuracy, s.played_at
      ORDER BY wpm DESC
      LIMIT 10
    `, [start, end]);

    res.json(result.rows);
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
