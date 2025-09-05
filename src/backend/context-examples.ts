// Example: Backend functions with context access
import { prisma } from "@/lib/prisma";
import { QuickwireContext, getBearerToken, getClientIP, requireAuth } from "@/lib/quickwire-context";

// Example 1: Simple function without context (existing pattern - unchanged)
export async function listPublicContacts() {
  return prisma.contact.findMany({
    where: { isPublic: true },
    select: { id: true, name: true } // Only public fields
  });
}

// Example 2: Function that optionally uses context
export async function getContactDetails(
  params: { id: string },
  context?: QuickwireContext  // Optional context parameter
) {
  const clientIP = context ? getClientIP(context) : 'unknown';
  
  console.log(`Contact ${params.id} accessed from IP: ${clientIP}`);
  
  return prisma.contact.findUnique({
    where: { id: params.id }
  });
}

// Example 3: Function that requires authentication
export async function createSecureContact(
  params: { name: string; email: string; phone?: string },
  context: QuickwireContext  // Required context for auth
) {
  // This will throw if no auth token is present
  const token = requireAuth(context);
  
  // Log the creation with IP for security
  console.log(`New contact created by token ${token.substring(0, 8)}... from IP ${getClientIP(context)}`);
  
  return prisma.contact.create({
    data: {
      ...params,
      createdByIP: getClientIP(context),
      createdAt: new Date()
    }
  });
}
 
// Example 4: Function using custom headers
export async function processWebhook(
  params: { payload: string },
  context: QuickwireContext
) {
  const signature = context.headers['x-webhook-signature'];
  const timestamp = context.headers['x-webhook-timestamp'];
  
  if (!signature || !timestamp) {
    throw new Error('Missing webhook headers');
  }
  
  // Validate webhook signature here
  console.log(`Processing webhook from ${getClientIP(context)}`);
  
  return { status: 'processed', timestamp: new Date() };
}

// Example 5: Function accessing cookies for session management
export async function getUserProfile(
  params: { userId?: string },
  context: QuickwireContext
) {
  const sessionId = context.cookies['session-id'];
  const userId = params.userId || getUserIdFromSession(sessionId);
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true }
  });
}

// Helper function (not exported, won't generate API route)
function getUserIdFromSession(sessionId?: string): string | null {
  // Implementation would validate session and return user ID
  return sessionId ? 'user-123' : null;
}