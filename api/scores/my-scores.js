import { sql, initDb } from '../db.js';
import { requireAuth } from '../auth.js';

// Helper to get today's date boundaries in EST
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
  // Enable CORS
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
    const { start, end } = getTodayBoundsEST();

    const { rows: scores } = await sql`
      SELECT wpm, accuracy, played_at
      FROM scores
      WHERE user_id = ${user.id}
        AND played_at >= ${start}::timestamp
        AND played_at <= ${end}::timestamp
      ORDER BY played_at DESC
    `;

    const { rows: bestRows } = await sql`
      SELECT MAX(wpm) as bestwpm, MAX(accuracy) as bestaccuracy
      FROM scores
      WHERE user_id = ${user.id}
        AND played_at >= ${start}::timestamp
        AND played_at <= ${end}::timestamp
    `;

    res.json({ scores, best: bestRows[0] });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.error('User scores fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
