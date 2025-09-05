// Authentication backend functions
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, generateToken, getAuthenticatedUser, JWTPayload } from '@/lib/auth';
import { QuickwireContext } from 'quickwire/types';

export interface SignupParams {
  name: string;
  email: string;
  password: string;
  role?: 'USER' | 'ADMIN';
  // Added comment to trigger file change
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
  };
  token: string;
}

// Sign up a new user
export async function signup(params: SignupParams): Promise<AuthResponse> {
  const { name, email, password, role = 'USER' } = params;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Validate password strength
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role
    }
  });

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as 'USER' | 'ADMIN'
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN'
    },
    token
  };
}

// Login user
export async function login(params: LoginParams): Promise<AuthResponse> {
  const { email, password } = params;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as 'USER' | 'ADMIN'
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN'
    },
    token
  };
}

// Get current user profile
export async function getProfile(
  context: QuickwireContext
): Promise<{
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
}> {
  const authUser = getAuthenticatedUser(context);

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    ...user,
    role: user.role as 'USER' | 'ADMIN'
  };
}

// Update user profile
export async function updateProfile(
  params: { name?: string; email?: string },
  context: QuickwireContext
): Promise<{
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}> {
  const authUser = getAuthenticatedUser(context);
  const { name, email } = params;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: authUser.userId }
      }
    });

    if (existingUser) {
      throw new Error('Email is already taken');
    }
  }

  const user = await prisma.user.update({
    where: { id: authUser.userId },
    data: {
      ...(name && { name }),
      ...(email && { email })
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  return {
    ...user,
    role: user.role as 'USER' | 'ADMIN'
  };
}

// Change password
export async function changePassword(
  params: { currentPassword: string; newPassword: string },
  context: QuickwireContext
): Promise<{ success: boolean }> {
  const authUser = getAuthenticatedUser(context);
  const { currentPassword, newPassword } = params;

  // Validate new password
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }

  // Get current user with password
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValidPassword = await verifyPassword(currentPassword, user.password);

  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: authUser.userId },
    data: { password: hashedNewPassword }
  });

  return { success: true };
}