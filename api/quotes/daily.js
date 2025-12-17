import { query, initDb, seedQuotes } from '../db.js';

// Get today's date in EST as a seed for consistent daily quote
function getDailyDateEST() {
  const now = new Date();
  const estOffset = -5 * 60;
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  const estNow = new Date(utcNow + estOffset * 60000);

  return `${estNow.getFullYear()}-${estNow.getMonth() + 1}-${estNow.getDate()}`;
}

// Simple hash function to convert date string to number
function hashDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
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
    await seedQuotes();

    // Get total count of quotes
    const countResult = await query('SELECT COUNT(*) as count FROM quotes');
    const totalQuotes = parseInt(countResult.rows[0].count);

    if (totalQuotes === 0) {
      return res.status(404).json({ error: 'No quotes available' });
    }

    // Use today's date to pick a consistent quote
    const dateStr = getDailyDateEST();
    const quoteIndex = hashDate(dateStr) % totalQuotes;

    // Get the quote at that index
    const result = await query('SELECT * FROM quotes ORDER BY id LIMIT 1 OFFSET $1', [quoteIndex]);
    const quote = result.rows[0];

    if (!quote) {
      return res.status(404).json({ error: 'No quote available' });
    }

    res.json(quote);
  } catch (err) {
    console.error('Daily quote fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
