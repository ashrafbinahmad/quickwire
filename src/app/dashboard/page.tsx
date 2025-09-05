'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthenticatedRequest } from '@/hooks/useAuthenticatedRequest';
import { getTodos, createTodo, updateTodo, deleteTodo, toggleTodo, getTodoStats } from 'quickwired/todo';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Todo } from '@prisma/client';



interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export default function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { getAuthConfig } = useAuthenticatedRequest();
  const router = useRouter();
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTodos();
      loadStats();
    }
  }, [isAuthenticated, filter]);

  const loadTodos = async () => {
    try {
      setError('');
      const authConfig = getAuthConfig();
      const filterParam = filter === 'all' ? {} : { completed: filter === 'completed' };
      const todosData = await getTodos(filterParam, authConfig);
      setTodos(todosData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const authConfig = getAuthConfig();
      const statsData = await getTodoStats( authConfig);
      setStats(statsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    }
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;

    setIsCreating(true);
    try {
      const authConfig = getAuthConfig();
      await createTodo(newTodo, authConfig);
      setNewTodo({ title: '', description: '' });
      loadTodos();
      loadStats();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleTodo = async (id: string) => {
    try {
      const authConfig = getAuthConfig();
      await toggleTodo({ id }, authConfig);
      loadTodos();
      loadStats();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;
    
    try {
      const authConfig = getAuthConfig();
      await deleteTodo({ id }, authConfig);
      loadTodos();
      loadStats();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'pending') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, {user?.name}!
                </h1>
                <p className="text-sm text-gray-600">
                  Role: <span className="font-medium">{user?.role}</span>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">#</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Todos</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">⏳</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.completed}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">%</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.completionRate}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-6 sm:px-0">
          {/* Create Todo Form */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Create New Todo
              </h3>
              <form onSubmit={handleCreateTodo} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Todo title..."
                    value={newTodo.title}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Description (optional)..."
                    value={newTodo.description}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating || !newTodo.title.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Todo'}
                </button>
              </form>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                {[
                  { key: 'all', label: 'All Todos' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'completed', label: 'Completed' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as "completed" | "pending" | "all")}
                    className={`w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                      filter === tab.key
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {/* Todos List */}
          <div className="space-y-4">
            {filteredTodos.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-500">
                  {filter === 'all' ? 'No todos yet. Create your first one!' : `No ${filter} todos.`}
                </p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <div key={todo.id} className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggleTodo(todo.id)}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <h4 className={`text-lg font-medium ${
                            todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}>
                            {todo.title}
                          </h4>
                          {todo.description && (
                            <p className={`mt-1 text-sm ${
                              todo.completed ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {todo.description}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Created: {new Date(todo.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="ml-4 text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}