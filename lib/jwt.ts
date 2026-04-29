import jwt, { type JwtPayload, type SignOptions, type Secret } from 'jsonwebtoken';

function getJwtSecret(): Secret {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

function getJwtExpiresIn(): SignOptions['expiresIn'] {
  return (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '7d';
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload): string {
  const options: SignOptions = {
    expiresIn: getJwtExpiresIn(),
  };
  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch (error) {
    throw error instanceof Error ? error : new Error('JWT verification failed');
  }
}
