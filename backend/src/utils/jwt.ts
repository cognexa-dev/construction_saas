import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../entities/User';

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
    issuer: 'forever-buildcon',
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
    issuer: 'forever-buildcon',
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.secret, {
    issuer: 'forever-buildcon',
  }) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret, {
    issuer: 'forever-buildcon',
  }) as TokenPayload;
}

export function getRefreshTokenExpiryDate(): Date {
  const expiry = new Date();
  const days = parseInt(env.jwt.refreshExpiresIn.replace('d', ''), 10) || 7;
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
