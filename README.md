# blurb

A minimal daily typing test. Type famous quotes, compete on the leaderboard.

## Features

- 40-word quotes from literature, speeches, and film
- Real-time WPM and accuracy tracking
- Daily leaderboard (resets at midnight EST)
- Light/dark mode

## Deploy to Vercel

1. Push this repo to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add a Postgres database from the Storage tab
4. Set environment variable: `JWT_SECRET` (any secure random string)
5. Deploy

## Local Development

```bash
# Install dependencies
npm install
cd client && npm install
cd ../server && npm install

# Run (SQLite locally)
cd server && npm run dev   # API on :3001
cd client && npm run dev   # App on :5173
```

## Stack

- React + Vite
- Vercel Serverless Functions
- Vercel Postgres
- JWT authentication
