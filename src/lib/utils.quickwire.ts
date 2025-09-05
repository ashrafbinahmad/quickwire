import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

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

type RequestData = FormData | Record<string, unknown> | string | number | boolean | null | undefined;

export async function makeQuickwireRequest<T>(
  url: string,
  method: string = 'POST',
  data?: RequestData,
  axiosConfig?: AxiosRequestConfig
): Promise<T> {
  const config: AxiosRequestConfig = {
    method: method.toLowerCase(),
    url,
    headers: {
      'Accept': 'application/json',
      ...axiosConfig?.headers,
    },
    ...axiosConfig,
  };

  // Handle different data types
  if (data !== undefined) {
    if (data instanceof FormData) {
      // Don't set Content-Type for FormData - axios will set it with boundary
      config.data = data;
      // Remove Content-Type if it was set, let axios handle FormData
      if (config.headers && 'Content-Type' in config.headers) {
        delete config.headers['Content-Type'];
      }
    } else if (data && typeof data === 'object') {
      config.headers = {
        ...config.headers,
        'Content-Type': 'application/json',
      };
      config.data = data;
    } else if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      config.data = data;
    }
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

    const response: AxiosResponse<T> = await axios(config);
    
    console.log(`✅ ${method} ${url} - Success`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${url} - Error:`, error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Request timeout after ${config.timeout}ms`);
      }
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.statusText || 
                          error.message || 
                          'Request failed';
      
      throw new Error(`HTTP ${error.response?.status || 'Unknown'}: ${errorMessage}`);
    }
    
    throw error;
  }
}