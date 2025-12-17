import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'blurb-secret-key-change-in-production';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function getUserFromRequest(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    return verifyToken(token);
  } catch (err) {
    return null;
  }
}

export function requireAuth(req) {
  const user = getUserFromRequest(req);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
