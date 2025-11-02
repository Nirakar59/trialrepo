// src/services/apiClient.js

import { API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES, STORAGE_KEYS } from '../utils/constants';

// Base API configuration
const API_CONFIG = {
  BASE_URL: API_ENDPOINTS.BASE_URL,
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Helper function to get auth token from storage
const getAuthToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to get refresh token from storage
const getRefreshToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

// Helper function to save auth token to storage
const saveAuthToken = (token) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

// Helper function to clear auth tokens
const clearAuthTokens = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
};

// Create base headers
const createHeaders = (includeAuth = true, contentType = 'application/json') => {
  const headers = {
    'Content-Type': contentType,
    'Accept': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Sleep function for retry delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error is retryable
const isRetryableError = (error) => {
  if (!error.response) return true; // Network errors are retryable
  
  const status = error.response.status;
  return status >= 500 || status === 408 || status === 429; // Server errors, timeout, rate limit
};

// Handle API errors
const handleApiError = (error, endpoint) => {
  console.error(`API Error - ${endpoint}:`, error);

  // Network error
  if (!error.response) {
    return {
      success: false,
      error: ERROR_MESSAGES.NETWORK_ERROR,
      status: null,
      data: null,
    };
  }

  const { status, data } = error.response;
  
  // Handle different status codes
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return {
        success: false,
        error: data?.message || ERROR_MESSAGES.SERVER_ERROR,
        status,
        data,
      };
    
    case HTTP_STATUS.UNAUTHORIZED:
      // Clear tokens on unauthorized
      clearAuthTokens();
      return {
        success: false,
        error: data?.message || ERROR_MESSAGES.INVALID_CREDENTIALS,
        status,
        data,
        shouldRedirectToLogin: true,
      };
    
    case HTTP_STATUS.FORBIDDEN:
      return {
        success: false,
        error: data?.message || 'Access forbidden',
        status,
        data,
      };
    
    case HTTP_STATUS.NOT_FOUND:
      return {
        success: false,
        error: data?.message || ERROR_MESSAGES.USER_NOT_FOUND,
        status,
        data,
      };
    
    case HTTP_STATUS.CONFLICT:
      return {
        success: false,
        error: data?.message || ERROR_MESSAGES.USER_ALREADY_EXISTS,
        status,
        data,
      };
    
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return {
        success: false,
        error: data?.message || ERROR_MESSAGES.TOO_MANY_OTP_REQUESTS,
        status,
        data,
      };
    
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return {
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR,
        status,
        data,
      };
    
    default:
      return {
        success: false,
        error: data?.message || ERROR_MESSAGES.UNEXPECTED_ERROR,
        status,
        data,
      };
  }
};

// Base API request function with retry logic
const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    data = null,
    headers = {},
    includeAuth = true,
    timeout = API_CONFIG.TIMEOUT,
    retryAttempts = API_CONFIG.RETRY_ATTEMPTS,
  } = options;

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const requestHeaders = { ...createHeaders(includeAuth), ...headers };

  // Request configuration
  const requestConfig = {
    method,
    headers: requestHeaders,
    signal: AbortSignal.timeout(timeout),
  };

  // Add body for non-GET requests
  if (data && method !== 'GET') {
    requestConfig.body = JSON.stringify(data);
  }

  let lastError;

  // Retry logic
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      console.log(`API Request - ${method} ${endpoint} (Attempt ${attempt + 1})`);
      
      const response = await fetch(url, requestConfig);
      const responseData = await response.json();

      // Handle successful response
      if (response.ok) {
        return {
          success: true,
          data: responseData,
          status: response.status,
        };
      }

      // Handle error response
      const error = new Error('API Error');
      error.response = {
        status: response.status,
        data: responseData,
      };
      
      throw error;

    } catch (error) {
      lastError = error;
      
      // Don't retry if it's not a retryable error or if it's the last attempt
      if (!isRetryableError(error) || attempt === retryAttempts) {
        break;
      }

      // Wait before retrying
      await sleep(API_CONFIG.RETRY_DELAY * (attempt + 1));
    }
  }

  // Return formatted error
  return handleApiError(lastError, endpoint);
};

// API client methods
const apiClient = {
  // GET request
  get: (endpoint, options = {}) => {
    return apiRequest(endpoint, { ...options, method: 'GET' });
  },

  // POST request
  post: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, { ...options, method: 'POST', data });
  },

  // PUT request
  put: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, { ...options, method: 'PUT', data });
  },

  // PATCH request
  patch: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, { ...options, method: 'PATCH', data });
  },

  // DELETE request
  delete: (endpoint, options = {}) => {
    return apiRequest(endpoint, { ...options, method: 'DELETE' });
  },

  // Upload file (multipart/form-data)
  upload: (endpoint, formData, options = {}) => {
    const headers = { ...options.headers };
    delete headers['Content-Type']; // Let browser set the boundary for FormData

    return apiRequest(endpoint, {
      ...options,
      method: 'POST',
      data: formData,
      headers,
    });
  },

  // Check API health
  health: async () => {
    try {
      const response = await apiRequest('/health', { includeAuth: false, retryAttempts: 0 });
      return response.success;
    } catch (error) {
      return false;
    }
  },

  // Utility functions
  utils: {
    getAuthToken,
    getRefreshToken,
    saveAuthToken,
    clearAuthTokens,
    createHeaders,
  },
};

// Mock API client for development (when backend is not ready)
const mockApiClient = {
  // Mock delay to simulate network latency
  mockDelay: (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms)),

  // GET request mock
  get: async (endpoint, options = {}) => {
    await mockApiClient.mockDelay();
    console.log(`Mock GET request to: ${endpoint}`);
    
    return {
      success: true,
      data: { message: 'Mock GET response', endpoint },
      status: 200,
    };
  },

  // POST request mock
  post: async (endpoint, data, options = {}) => {
    await mockApiClient.mockDelay();
    console.log(`Mock POST request to: ${endpoint}`, data);
    
    return {
      success: true,
      data: { message: 'Mock POST response', endpoint, receivedData: data },
      status: 201,
    };
  },

  // PUT request mock
  put: async (endpoint, data, options = {}) => {
    await mockApiClient.mockDelay();
    console.log(`Mock PUT request to: ${endpoint}`, data);
    
    return {
      success: true,
      data: { message: 'Mock PUT response', endpoint, receivedData: data },
      status: 200,
    };
  },

  // PATCH request mock
  patch: async (endpoint, data, options = {}) => {
    await mockApiClient.mockDelay();
    console.log(`Mock PATCH request to: ${endpoint}`, data);
    
    return {
      success: true,
      data: { message: 'Mock PATCH response', endpoint, receivedData: data },
      status: 200,
    };
  },

  // DELETE request mock
  delete: async (endpoint, options = {}) => {
    await mockApiClient.mockDelay();
    console.log(`Mock DELETE request to: ${endpoint}`);
    
    return {
      success: true,
      data: { message: 'Mock DELETE response', endpoint },
      status: 200,
    };
  },

  // Health check mock
  health: async () => {
    await mockApiClient.mockDelay(200);
    return true;
  },
};

// Export the appropriate client based on environment
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true' || !process.env.REACT_APP_API_URL;

export default USE_MOCK_API ? mockApiClient : apiClient;
export { apiClient, mockApiClient };