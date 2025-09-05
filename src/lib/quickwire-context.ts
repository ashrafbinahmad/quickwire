// Quickwire Context Utilities
// These utilities provide easy access to request context in backend functions

export interface QuickwireContext {
  req: Request;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  ip: string;
  userAgent: string;
}

// Helper functions that can be used in backend functions
export function getHeader(context: QuickwireContext, name: string): string | null {
  return context.headers[name.toLowerCase()] || null;
}

export function getCookie(context: QuickwireContext, name: string): string | null {
  return context.cookies[name] || null;
}

export function getClientIP(context: QuickwireContext): string {
  return context.ip;
}

export function getUserAgent(context: QuickwireContext): string {
  return context.userAgent;
}

export function getBearerToken(context: QuickwireContext): string | null {
  const auth = getHeader(context, 'authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.substring(7);
  }
  return null;
}

export function getBasicAuth(context: QuickwireContext): { username: string; password: string } | null {
  const auth = getHeader(context, 'authorization');
  if (auth && auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.substring(6));
      const [username, password] = decoded.split(':');
      return { username, password };
    } catch {
      return null;
    }
  }
  return null;
}

// Validation helpers
export function requireAuth(context: QuickwireContext): string {
  const token = getBearerToken(context);
  if (!token) {
    throw new Error('Authentication required');
  }
  return token;
}

export function requireHeader(context: QuickwireContext, name: string): string {
  const value = getHeader(context, name);
  if (!value) {
    throw new Error(`Required header '${name}' is missing`);
  }
  return value;
}