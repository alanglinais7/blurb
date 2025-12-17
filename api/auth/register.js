import bcrypt from 'bcryptjs';
import { sql, initDb, seedQuotes } from '../db.js';
import { generateToken } from '../auth.js';

export default async function handler(req, res) {
  // Enable CORS
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
    // Initialize DB on first request
    await initDb();
    await seedQuotes();

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username exists
    const { rows: existing } = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await sql`
      INSERT INTO users (username, password_hash)
      VALUES (${username}, ${passwordHash})
      RETURNING id, username
    `;

    const user = rows[0];
    const token = generateToken(user);

    res.json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
