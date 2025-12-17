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

    // Get each user's best score with the quote length to calculate time
    const result = await query(`
      SELECT DISTINCT ON (u.username)
        u.username,
        s.wpm,
        LENGTH(q.text) as quote_length
      FROM scores s
      JOIN users u ON s.user_id = u.id
      JOIN quotes q ON s.quote_id = q.id
      WHERE s.played_at >= $1 AND s.played_at <= $2
      ORDER BY u.username, s.wpm DESC
    `, [start, end]);

    // Calculate time and sort by WPM
    const withTime = result.rows.map(row => {
      // WPM = (chars / 5) / minutes, so minutes = (chars / 5) / WPM
      const words = row.quote_length / 5;
      const minutes = words / row.wpm;
      const seconds = minutes * 60;
      return {
        ...row,
        time: seconds.toFixed(1)
      };
    }).sort((a, b) => b.wpm - a.wpm).slice(0, 10);

    res.json(withTime);
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
