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

// Create an API client instance
export const apiClient = {
  get: async <T>(endpoint: string, token?: string): Promise<ApiResponseWithCache<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    // 304 Not Modified is a successful response, not an error
    if (!response.ok && response.status !== 304) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'An error occurred');
    }

    // For 304 responses, we need to handle them differently since they don't have a body
    if (response.status === 304) {
      // Return a success response indicating no changes
      return {
        status: 'success',
        data: {} as T,
        message: 'No changes since last request',
        cached: true,
        statusCode: 304
      };
    }

    const responseData = await response.json();
    return {
      ...responseData,
      cached: false,
      statusCode: response.status
    };
  },

  post: async <T, D = unknown>(endpoint: string, data: D, token?: string): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
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
      
      const enhancedError = new Error(errorMessage);
      (enhancedError as Error & { status: number; statusText: string; details: unknown }).status = response.status;
      (enhancedError as Error & { status: number; statusText: string; details: unknown }).statusText = response.statusText;
      (enhancedError as Error & { status: number; statusText: string; details: unknown }).details = errorDetails;
      throw enhancedError;
    }

    return response.json();
  },

  put: async <T, D = unknown>(endpoint: string, data: D, token?: string): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'An error occurred');
    }

    return response.json();
  },

  delete: async <T>(endpoint: string, token?: string): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'An error occurred');
    }

    return response.json();
  },

  patch: async <T, D = unknown>(endpoint: string, data: D, token?: string): Promise<ApiResponse<T>> => {
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

      const enhancedError = new Error(errorMessage);
      (enhancedError as Error & { status: number; statusText: string; details: unknown }).status = response.status;
      (enhancedError as Error & { status: number; statusText: string; details: unknown }).statusText = response.statusText;
      (enhancedError as Error & { status: number; statusText: string; details: unknown }).details = errorDetails;
      throw enhancedError;
    }

    return response.json();
  },
};