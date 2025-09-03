// src/lib/api/client.ts

const API_BASE_URL = 'https://ajws-school-ba8ae5e3f955.herokuapp.com';

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface ApiResponseWithCache<T> extends ApiResponse<T> {
  cached?: boolean;
  statusCode?: number;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  statusCode: number;
  error?: string;
  details?: unknown;
}

// Create an API client instance
export const apiClient = {
  get: async <T>(
    endpoint: string, 
    token?: string, 
    options?: {
      responseType?: 'json' | 'blob';
    }
  ): Promise<ApiResponseWithCache<T> | ApiErrorResponse | Blob> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    // 304 Not Modified is a successful response, not an error
    if (!response.ok && response.status !== 304) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      // Handle specific HTTP status codes with user-friendly messages
      if (response.status === 404) {
        errorMessage = 'Resource not found';
      } else if (response.status === 403) {
        errorMessage = 'Access denied';
      } else if (response.status === 401) {
        errorMessage = 'Authentication required';
      } else if (response.status === 500) {
        errorMessage = 'Internal server error';
      }

      try {
        // Try to parse JSON error response
        const errorData = await response.json();
        // Override with API-provided message if available
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // If JSON parsing fails, try to get text content
        try {
          const textContent = await response.text();
          if (textContent && textContent.length < 500) { // Only use if it's a reasonable error message
            errorMessage = textContent;
          }
        } catch (textError) {
          // If both JSON and text parsing fail, use the default error message
          console.warn('Failed to parse error response:', textError);
        }
      }

      // Log error details for debugging
      console.error('API Error:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });

      // Return error response instead of throwing
      return {
        status: 'error',
        message: errorMessage,
        statusCode: response.status,
        error: response.statusText,
        details: {
          endpoint,
          status: response.status,
          timestamp: new Date().toISOString(),
          url: `${API_BASE_URL}${endpoint}`
        }
      };
    }

    // For 304 responses, we need to handle them differently since they don't have a body
    if (response.status === 304) {
      return {
        status: 'success',
        data: {} as T,
        cached: true,
        statusCode: 304
      };
    }

    // Handle different response types
    if (options?.responseType === 'blob') {
      return response.blob();
    }

    return response.json();
  },

  post: async <T, D = unknown>(
    endpoint: string, 
    data: D, 
    token?: string, 
    options?: {
      headers?: Record<string, string>;
      responseType?: 'json' | 'blob';
    }
  ): Promise<ApiResponse<T> | ApiErrorResponse | Blob> => {
    const isFormData = data instanceof FormData;
    
    const headers: Record<string, string> = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    // Only set Content-Type for non-FormData requests
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails = null;
      
      try {
        const errorData = await response.json();
        errorDetails = errorData;
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // If we can't parse the error response, use the status text
      }
      
      // Return error response instead of throwing
      return {
        status: 'error',
        message: errorMessage,
        statusCode: response.status,
        error: response.statusText,
        details: errorDetails
      };
    }

    // Handle different response types
    if (options?.responseType === 'blob') {
      return response.blob();
    }

    return response.json();
  },

  put: async <T, D = unknown>(endpoint: string, data: D, token?: string): Promise<ApiResponse<T> | ApiErrorResponse> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // If we can't parse the error response, use the status text
      }
      
      // Return error response instead of throwing
      return {
        status: 'error',
        message: errorMessage,
        statusCode: response.status,
        error: response.statusText
      };
    }

    return response.json();
  },

  delete: async <T>(endpoint: string, token?: string): Promise<ApiResponse<T> | ApiErrorResponse> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // If we can't parse the error response, use the status text
      }
      
      // Return error response instead of throwing
      return {
        status: 'error',
        message: errorMessage,
        statusCode: response.status,
        error: response.statusText
      };
    }

    return response.json();
  },

  patch: async <T, D = unknown>(endpoint: string, data: D, token?: string): Promise<ApiResponse<T> | ApiErrorResponse> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails = null;

      try {
        const errorData = await response.json();
        errorDetails = errorData;

        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // If we can't parse the error response, use the status text
      }

      // Return error response instead of throwing
      return {
        status: 'error',
        message: errorMessage,
        statusCode: response.status,
        error: response.statusText,
        details: errorDetails
      };
    }

    return response.json();
  },
};