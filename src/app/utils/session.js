import jwt from 'jsonwebtoken';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.AURA_JWT_SECRET || '';
  if (!secret) {
    throw new Error('JWT secret is missing. Set JWT_SECRET or AURA_JWT_SECRET.');
  }
  return secret;
}

export function signSession(payload, expiresIn = '7d') {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifySessionToken(token) {
  return jwt.verify(token, getJwtSecret());
}
