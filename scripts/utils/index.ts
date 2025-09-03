// quickwire/utils/index.ts


// Enhanced request function with better error handling


// Enhanced FormData conversion with proper nested object support


// Utility to validate file types
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  return allowedTypes.some(type => {
    if (type.includes('/')) {
      // MIME type check
      return fileType === type.toLowerCase();
    } else {
      // Extension check
      return fileName.endsWith(`.${type.toLowerCase()}`);
    }
  });
}

// Utility to validate file size
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

// Utility to create a preview URL for files
export function createFilePreview(file: File): string | null {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return null;
}

// Debug utility to inspect FormData
export function debugFormData(formData: FormData, label: string = 'FormData'): void {
  console.group(`🔍 ${label} Debug`);
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
    } else {
      console.log(`${key}:`, value);
    }
  }
  console.groupEnd();
}

// Type-safe parameter extraction for GET/DELETE requests
export function extractSearchParams<T extends Record<string, any>>(
  searchParams: URLSearchParams,
  schema: { [K in keyof T]: 'string' | 'number' | 'boolean' | 'string[]' }
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, type] of Object.entries(schema)) {
    const value = searchParams.get(key);
    
    if (value !== null) {
      switch (type) {
        case 'string':
          (result as any)[key] = value;
          break;
        case 'number':
          const num = Number(value);
          if (!isNaN(num)) {
            (result as any)[key] = num;
          }
          break;
        case 'boolean':
          (result as any)[key] = value === 'true';
          break;
        case 'string[]':
          (result as any)[key] = searchParams.getAll(key);
          break;
      }
    }
  }

  return result;
}

// Utility to create error responses
export function createErrorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Utility to create success responses
export function createSuccessResponse<T>(data: T, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Rate limiting utility (simple in-memory)
class SimpleRateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

export const rateLimiter = new SimpleRateLimiter();

// Export types for better TypeScript support
export interface FileUploadOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  multiple?: boolean;
}

export interface QuickwireError extends Error {
  status?: number;
  code?: string;
}