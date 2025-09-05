// Todo backend functions with role-based access control
import { prisma } from '@/lib/prisma';
import { QuickwireContext } from '@/lib/quickwire-context';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTodoParams {
  title: string;
  description?: string;
}

export interface UpdateTodoParams {
  id: string;
  title?: string;
  description?: string;
  completed?: boolean;
}

// Get user's todos (users can only see their own)
export async function getTodos(
  params: { completed?: boolean },
  context: QuickwireContext
): Promise<Todo[]> {
  const authUser = getAuthenticatedUser(context);
  const { completed } = params;

  const todos = await prisma.todo.findMany({
    where: {
      userId: authUser.userId,
      ...(completed !== undefined && { completed })
    },
    orderBy: { createdAt: 'desc' }
  });

  return todos;
}

// Get all todos (admin only)
export async function getAllTodos(
  params: { userId?: string; completed?: boolean },
  context: QuickwireContext
): Promise<Todo[]> {
  requireAdmin(context);
  const { userId, completed } = params;

  const todos = await prisma.todo.findMany({
    where: {
      ...(userId && { userId }),
      ...(completed !== undefined && { completed })
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return todos;
}

// Get single todo (users can only access their own, admins can access any)
export async function getTodo(
  params: { id: string },
  context: QuickwireContext
): Promise<Todo> {
  const authUser = getAuthenticatedUser(context);
  const { id } = params;

  const todo = await prisma.todo.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!todo) {
    throw new Error('Todo not found');
  }

  // Users can only access their own todos, admins can access any
  if (authUser.role !== 'ADMIN' && todo.userId !== authUser.userId) {
    throw new Error('Access denied');
  }

  return todo;
}

// Create todo (users create for themselves, admins can create for any user)
export async function createTodo(
  params: CreateTodoParams & { userId?: string },
  context: QuickwireContext
): Promise<Todo> {
  const authUser = getAuthenticatedUser(context);
  const { title, description, userId } = params;

  // Determine target user ID
  let targetUserId = authUser.userId;

  // If userId is provided and user is admin, allow creating for other users
  if (userId && authUser.role === 'ADMIN') {
    targetUserId = userId;
    
    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });
    
    if (!targetUser) {
      throw new Error('Target user not found');
    }
  } else if (userId && authUser.role !== 'ADMIN') {
    throw new Error('Only admins can create todos for other users');
  }

  const todo = await prisma.todo.create({
    data: {
      title,
      description,
      userId: targetUserId
    }
  });

  return todo;
}

// Update todo (users can only update their own, admins can update any)
export async function updateTodo(
  params: UpdateTodoParams,
  context: QuickwireContext
): Promise<Todo> {
  const authUser = getAuthenticatedUser(context);
  const { id, title, description, completed } = params;

  // Check if todo exists and user has access
  const existingTodo = await prisma.todo.findUnique({
    where: { id }
  });

  if (!existingTodo) {
    throw new Error('Todo not found');
  }

  // Users can only update their own todos, admins can update any
  if (authUser.role !== 'ADMIN' && existingTodo.userId !== authUser.userId) {
    throw new Error('Access denied');
  }

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(completed !== undefined && { completed })
    }
  });

  return todo;
}

// Delete todo (users can only delete their own, admins can delete any)
export async function deleteTodo(
  params: { id: string },
  context: QuickwireContext
): Promise<{ success: boolean }> {
  const authUser = getAuthenticatedUser(context);
  const { id } = params;

  // Check if todo exists and user has access
  const existingTodo = await prisma.todo.findUnique({
    where: { id }
  });

  if (!existingTodo) {
    throw new Error('Todo not found');
  }

  // Users can only delete their own todos, admins can delete any
  if (authUser.role !== 'ADMIN' && existingTodo.userId !== authUser.userId) {
    throw new Error('Access denied');
  }

  await prisma.todo.delete({
    where: { id }
  });

  return { success: true };
}

// Toggle todo completion
export async function toggleTodo(
  params: { id: string },
  context: QuickwireContext
): Promise<Todo> {
  const authUser = getAuthenticatedUser(context);
  const { id } = params;

  // Check if todo exists and user has access
  const existingTodo = await prisma.todo.findUnique({
    where: { id }
  });

  if (!existingTodo) {
    throw new Error('Todo not found');
  }

  // Users can only toggle their own todos, admins can toggle any
  if (authUser.role !== 'ADMIN' && existingTodo.userId !== authUser.userId) {
    throw new Error('Access denied');
  }

  const todo = await prisma.todo.update({
    where: { id },
    data: { completed: !existingTodo.completed }
  });

  return todo;
}

// Get todo statistics (users get their own stats, admins get all stats)
export async function getTodoStats(
  context: QuickwireContext
): Promise<{
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}> {
  const authUser = getAuthenticatedUser(context);

  const whereClause = authUser.role === 'ADMIN' ? {} : { userId: authUser.userId };

  const [total, completed] = await Promise.all([
    prisma.todo.count({ where: whereClause }),
    prisma.todo.count({ where: { ...whereClause, completed: true } })
  ]);

  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending,
    completionRate
  };
}