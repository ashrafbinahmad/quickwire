// Admin backend functions for user management
import { prisma } from '@/lib/prisma';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { QuickwireContext } from 'quickwire/types';

export interface UserWithStats {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  todoStats: {
    total: number;
    completed: number;
    pending: number;
  };
}

// Get all users (admin only)
export async function getUsers(
  params: { role?: 'USER' | 'ADMIN' },
  context: QuickwireContext
): Promise<UserWithStats[]> {
  requireAdmin(context);
  const { role } = params;

  const users = await prisma.user.findMany({
    where: {
      ...(role && { role })
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          todos: true
        }
      },
      todos: {
        select: {
          completed: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as 'USER' | 'ADMIN',
    createdAt: user.createdAt,
    todoStats: {
      total: user._count.todos,
      completed: user.todos.filter(todo => todo.completed).length,
      pending: user.todos.filter(todo => !todo.completed).length
    }
  }));
}

// Get user details (admin only)
export async function getUserDetails(
  params: { id: string },
  context: QuickwireContext
): Promise<UserWithStats & { recentTodos: Array<{ id: string; title: string; completed: boolean; createdAt: Date }> }> {
  requireAdmin(context);
  const { id } = params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          todos: true
        }
      },
      todos: {
        select: {
          id: true,
          title: true,
          completed: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const completedCount = user.todos.filter(todo => todo.completed).length;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as 'USER' | 'ADMIN',
    createdAt: user.createdAt,
    todoStats: {
      total: user._count.todos,
      completed: completedCount,
      pending: user._count.todos - completedCount
    },
    recentTodos: user.todos
  };
}

// Create user (admin only)
export async function createUser(
  params: {
    name: string;
    email: string;
    password: string;
    role?: 'USER' | 'ADMIN';
  },
  context: QuickwireContext
): Promise<{
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}> {
  requireAdmin(context);
  const { name, email, password, role = 'USER' } = params;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Validate password
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

// Update user (admin only)
export async function updateUser(
  params: {
    id: string;
    name?: string;
    email?: string;
    role?: 'USER' | 'ADMIN';
  },
  context: QuickwireContext
): Promise<{
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}> {
  requireAdmin(context);
  const { id, name, email, role } = params;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  // Check if email is already taken by another user
  if (email) {
    const emailTaken = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id }
      }
    });

    if (emailTaken) {
      throw new Error('Email is already taken');
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role })
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

// Delete user (admin only)
export async function deleteUser(
  params: { id: string },
  context: QuickwireContext
): Promise<{ success: boolean }> {
  requireAdmin(context);
  const { id } = params;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  // Delete user (todos will be cascade deleted)
  await prisma.user.delete({
    where: { id }
  });

  return { success: true };
}

// Get dashboard stats (admin only)
export async function getDashboardStats(
  context: QuickwireContext
): Promise<{
  users: {
    total: number;
    admins: number;
    regularUsers: number;
  };
  todos: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
  recentActivity: Array<{
    type: 'user_created' | 'todo_created' | 'todo_completed';
    userName: string;
    userEmail: string;
    todoTitle?: string;
    createdAt: Date;
  }>;
}> {
  requireAdmin(context);

  const [
    totalUsers,
    adminUsers,
    totalTodos,
    completedTodos,
    recentUsers,
    recentTodos,
    recentCompletions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.todo.count(),
    prisma.todo.count({ where: { completed: true } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { name: true, email: true, createdAt: true }
    }),
    prisma.todo.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        title: true,
        createdAt: true,
        user: { select: { name: true, email: true } }
      }
    }),
    prisma.todo.findMany({
      where: { completed: true },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        title: true,
        updatedAt: true,
        user: { select: { name: true, email: true } }
      }
    })
  ]);

  const recentActivity = [
    ...recentUsers.map(user => ({
      type: 'user_created' as const,
      userName: user.name,
      userEmail: user.email,
      createdAt: user.createdAt
    })),
    ...recentTodos.map(todo => ({
      type: 'todo_created' as const,
      userName: todo.user.name,
      userEmail: todo.user.email,
      todoTitle: todo.title,
      createdAt: todo.createdAt
    })),
    ...recentCompletions.map(todo => ({
      type: 'todo_completed' as const,
      userName: todo.user.name,
      userEmail: todo.user.email,
      todoTitle: todo.title,
      createdAt: todo.updatedAt
    }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);

  return {
    users: {
      total: totalUsers,
      admins: adminUsers,
      regularUsers: totalUsers - adminUsers
    },
    todos: {
      total: totalTodos,
      completed: completedTodos,
      pending: totalTodos - completedTodos,
      completionRate: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0
    },
    recentActivity
  };
}