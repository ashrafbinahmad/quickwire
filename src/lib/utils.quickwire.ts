export function convertToFormData(obj: Record<string, unknown>, formData?: FormData, parentKey?: string): FormData {
  if (!formData) {
    formData = new FormData();
  }

  function appendToFormData(key: string, value: unknown): void {
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
      const objectValue = value as Record<string, unknown>;
      Object.keys(objectValue).forEach(subKey => {
        const nestedKey = parentKey ? `${key}.${subKey}` : `${key}.${subKey}`;
        appendToFormData(nestedKey, objectValue[subKey]);
      });
    } else {
      // Primitive values
      const stringValue: string = typeof value === 'boolean' || typeof value === 'number' 
        ? value.toString() 
        : String(value);
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

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

type RequestData = FormData | Record<string, unknown> | string | number | boolean | null | undefined;

export async function makeQuickwireRequest<T>(
  url: string,
  method: string = 'POST',
  data?: RequestData,
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
    } else if (typeof data === 'string') {
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
        const errorData = await response.json() as { error?: string };
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