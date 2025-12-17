import { sql, initDb } from '../db.js';
import { requireAuth } from '../auth.js';

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

    const { rows } = await sql`
      SELECT
        COUNT(*) as totalgames,
        AVG(wpm) as avgwpm,
        MAX(wpm) as bestwpm,
        AVG(accuracy) as avgaccuracy
      FROM scores
      WHERE user_id = ${user.id}
    `;

    res.json(rows[0]);
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.error('User stats fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
