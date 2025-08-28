// quickwire/utils/index.ts
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

// Enhanced request function with better error handling
export async function makeQuickwireRequest<T>(
  url: string,
  method: string = 'POST',
  data?: any,
  config?: RequestConfig
): Promise<T> {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Accept': 'application/json',
      ...config?.headers,
    },
  };

  // Handle different data types
  if (data !== undefined) {
    if (data instanceof FormData) {
      // Don't set Content-Type for FormData - browser will set it with boundary
      requestInit.body = data;
    } else if (data && typeof data === 'object') {
      requestInit.headers = {
        ...requestInit.headers,
        'Content-Type': 'application/json',
      };
      requestInit.body = JSON.stringify(data);
    } else {
      requestInit.body = data;
    }
  }

  // Add timeout support
  const controller = new AbortController();
  if (config?.timeout) {
    setTimeout(() => controller.abort(), config.timeout);
    requestInit.signal = controller.signal;
  }

  try {
    console.log(`🚀 Making ${method} request to ${url}`);
    if (data instanceof FormData) {
      console.log('📎 FormData entries:');
      for (const [key, value] of data.entries()) {
        console.log(`  ${key}: ${value instanceof File ? `File(${value.name})` : value}`);
      }
    } else if (data) {
      console.log('📦 Request body:', data);
    }

    const response = await fetch(url, requestInit);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json() as any;
        if (errorData && typeof errorData === 'object' && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // If we can't parse the error as JSON, use the status text
      }

      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      console.log(`✅ ${method} ${url} - Success`, result);
      return result as T;
    } else {
      const result = await response.text();
      console.log(`✅ ${method} ${url} - Success (text)`, result);
      return result as unknown as T;
    }
  } catch (error) {
    console.error(`❌ ${method} ${url} - Error:`, error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${config?.timeout}ms`);
      }
    }
    
    throw error;
  }
}

// Enhanced FormData conversion with proper nested object support
export function convertToFormData(obj: any, formData?: FormData, parentKey?: string): FormData {
  if (!formData) {
    formData = new FormData();
  }

  function appendToFormData(key: string, value: any): void {
    if (value === null || value === undefined) {
      return; // Skip null/undefined values
    }

    if (value instanceof File || value instanceof Blob) {
      formData!.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayKey = `${key}[${index}]`;
        if (item && typeof item === 'object' && !(item instanceof File) && !(item instanceof Blob)) {
          // For nested objects in arrays, flatten them
          Object.keys(item).forEach(subKey => {
            appendToFormData(`${arrayKey}.${subKey}`, item[subKey]);
          });
        } else {
          appendToFormData(arrayKey, item);
        }
      });
    } else if (value && typeof value === 'object') {
      // Nested object - flatten it
      Object.keys(value).forEach(subKey => {
        const nestedKey = parentKey ? `${key}.${subKey}` : `${key}.${subKey}`;
        appendToFormData(nestedKey, value[subKey]);
      });
    } else {
      // Primitive values
      const stringValue = typeof value === 'boolean' || typeof value === 'number' 
        ? value.toString() 
        : value;
      formData!.append(key, stringValue);
    }
  }

  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      appendToFormData(key, obj[key]);
    });
  }

  return formData;
}

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