import { sql, initDb, seedQuotes } from '../db.js';

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
    await seedQuotes();

    const { rows } = await sql`SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1`;
    const quote = rows[0];

    if (!quote) {
      return res.status(404).json({ error: 'No quotes available' });
    }

    res.json(quote);
  } catch (err) {
    console.error('Quote fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
