const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth API
export const auth = {
  register: (username, password) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username, password) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => fetchAPI('/auth/me'),
};

// Quotes API
export const quotes = {
  getRandom: () => fetchAPI('/quotes/random'),
  getDaily: () => fetchAPI('/quotes/daily'),
};

// Scores API
export const scores = {
  submit: (wpm, accuracy, quoteId) =>
    fetchAPI('/scores', {
      method: 'POST',
      body: JSON.stringify({ wpm, accuracy, quoteId }),
    }),

  getLeaderboard: () => fetchAPI('/scores/leaderboard'),

  getMyScores: () => fetchAPI('/scores/my-scores'),

  getMyStats: () => fetchAPI('/scores/my-stats'),
};

export default { auth, quotes, scores };
