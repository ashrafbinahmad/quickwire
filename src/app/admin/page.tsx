"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthenticatedRequest } from "@/hooks/useAuthenticatedRequest";
import { getDashboardStats, getUsers } from "quickwired/admin";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getAllTodos } from "quickwired/todo";
import { Todo, User } from "@prisma/client";
import { UserWithStats } from "@/backend/admin";



interface DashboardStats {
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
    type: "user_created" | "todo_created" | "todo_completed";
    userName: string;
    userEmail: string;
    todoTitle?: string;
    createdAt: Date;
  }>;
}

export default function AdminPage() {
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const { getAuthConfig } = useAuthenticatedRequest();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "todos">(
    "dashboard"
  );
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [todos, setTodos] = useState<Awaited<ReturnType<typeof getAllTodos>>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push(isAuthenticated ? "/dashboard" : "/auth");
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadData();
    }
  }, [isAuthenticated, isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const authConfig = getAuthConfig();

      if (activeTab === "dashboard") {
        const statsData = await getDashboardStats( authConfig);
        setStats(statsData);
      } else if (activeTab === "users") {
        const usersData = await getUsers({}, authConfig);
        setUsers(usersData);
      } else if (activeTab === "todos") {
        const todosData = await getAllTodos({}, authConfig);
        setTodos(todosData);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-purple-800 text-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <p className="text-purple-200">
                  System administration and management
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: "dashboard", label: "Dashboard", icon: "📊" },
                { key: "users", label: "Users", icon: "👥" },
                { key: "todos", label: "All Todos", icon: "📝" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as "dashboard" | "users" | "todos")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-purple-500 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && stats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            👥
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Users
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.users.total}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            ⭐
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Admins
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.users.admins}
                          </dd>
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
                          <span className="text-white text-sm font-bold">
                            📝
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Todos
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.todos.total}
                          </dd>
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
                          <span className="text-white text-sm font-bold">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Completion Rate
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.todos.completionRate}%
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {stats.recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                            activity.type === "user_created"
                              ? "bg-blue-500"
                              : activity.type === "todo_created"
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }`}
                        >
                          {activity.type === "user_created"
                            ? "👤"
                            : activity.type === "todo_created"
                            ? "📝"
                            : "✅"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {activity.type === "user_created" &&
                              `New user ${activity.userName} registered`}
                            {activity.type === "todo_created" &&
                              `${activity.userName} created "${activity.todoTitle}"`}
                            {activity.type === "todo_completed" &&
                              `${activity.userName} completed "${activity.todoTitle}"`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  All Users
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Todos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div>Total: {user.todoStats.total}</div>
                              <div className="text-xs text-gray-500">
                                {user.todoStats.completed} completed,{" "}
                                {user.todoStats.pending} pending
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Todos Tab */}
          {activeTab === "todos" && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  All Todos
                </h3>
                <div className="space-y-4">
                  {todos?.map((todo) => (
                    <div
                      key={todo.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`w-3 h-3 rounded-full ${
                                todo.completed
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                              }`}
                            ></span>
                            <h4
                              className={`font-medium ${
                                todo.completed
                                  ? "text-gray-500 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {todo.title}
                            </h4>
                          </div>
                          {todo.userId && (
                            <p className="text-sm text-gray-600 mt-1">
                              By: {todo.user?.name} ({todo.user?.email})
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(todo.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            todo.completed
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {todo.completed ? "Completed" : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
