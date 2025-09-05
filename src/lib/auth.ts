// Authentication utilities for JWT and password hashing
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { QuickwireContext, getHeader } from '@/lib/quickwire-context';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Extract token from context
export function getTokenFromContext(context: QuickwireContext): string | null {
  const authHeader = getHeader(context, 'authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

// Get authenticated user from context
export function getAuthenticatedUser(context: QuickwireContext): JWTPayload {
  const token = getTokenFromContext(context);
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  return verifyToken(token);
}

// Check if user has required role
export function requireRole(context: QuickwireContext, requiredRole: 'USER' | 'ADMIN'): JWTPayload {
  const user = getAuthenticatedUser(context);
  
  if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  
  return user;
}

// Check if user is admin
export function requireAdmin(context: QuickwireContext): JWTPayload {
  return requireRole(context, 'ADMIN');
}

// Optional authentication - returns user if authenticated, null otherwise
export function getOptionalUser(context: QuickwireContext): JWTPayload | null {
  try {
    return getAuthenticatedUser(context);
  } catch {
    return null;
  }
}