// src/services/authService.js

import apiClient from './apiClient';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';

// Authentication service
const authService = {
  // Login user
  login: async (credentials) => {
    try {
      console.log('AuthService: Login attempt for email:', credentials.email);

      // For mock API, simulate different scenarios
      if (apiClient === require('./apiClient').mockApiClient) {
        return await mockLogin(credentials);
      }

      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: credentials.email,
        password: credentials.password,
      });

      if (response.success) {
        const { user, tokens } = response.data;
        
        // Save tokens to storage
        if (tokens) {
          apiClient.utils.saveAuthToken(tokens.accessToken);
          localStorage.setItem('refresh_token', tokens.refreshToken);
        }

        console.log('AuthService: Login successful');
        return {
          success: true,
          data: {
            user,
            tokens,
            message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
          },
        };
      }

      return response;
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return {
        success: false,
        error: error.message || ERROR_MESSAGES.UNEXPECTED_ERROR,
      };
    }
  },

  // Register new user
  signup: async (userData) => {
    try {
      console.log('AuthService: Signup attempt for email:', userData.email);

      // For mock API, simulate different scenarios
      if (apiClient === require('./apiClient').mockApiClient) {
        return await mockSignup(userData);
      }

      const response = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, {
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password,
      });

      if (response.success) {
        console.log('AuthService: Signup successful, OTP sent');
        return {
          success: true,
          data: {
            email: userData.email,
            message: SUCCESS_MESSAGES.SIGNUP_SUCCESS,
            otpSent: true,
          },
        };
      }

      return response;
    } catch (error) {
      console.error('AuthService: Signup error:', error);
      return {
        success: false,
        error: error.message || ERROR_MESSAGES.UNEXPECTED_ERROR,
      };
    }
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    try {
      console.log('AuthService: OTP verification for email:', email);

      // For mock API, simulate different scenarios
      if (apiClient === require('./apiClient').mockApiClient) {
        return await mockVerifyOTP(email, otp);
      }

      const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        email,
        otp,
      });

      if (response.success) {
        const { user, tokens } = response.data;
        
        // Save tokens to storage
        if (tokens) {
          apiClient.utils.saveAuthToken(tokens.accessToken);
          localStorage.setItem('refresh_token', tokens.refreshToken);
        }

        console.log('AuthService: OTP verification successful');
        return {
          success: true,
          data: {
            user,
            tokens,
            message: SUCCESS_MESSAGES.OTP_VERIFIED,
          },
        };
      }

      return response;
    } catch (error) {
      console.error('AuthService: OTP verification error:', error);
      return {
        success: false,
        error: error.message || ERROR_MESSAGES.INVALID_OTP,
      };
    }
  },

  // Resend OTP
  resendOTP: async (email) => {
    try {
      console.log('AuthService: Resending OTP for email:', email);

      // For mock API, simulate different scenarios
      if (apiClient === require('./apiClient').mockApiClient) {
        return await mockResendOTP(email);
      }

      const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, {
        email,
      });

      if (response.success) {
        console.log('AuthService: OTP resent successfully');
        return {
          success: true,
          data: {
            message: SUCCESS_MESSAGES.OTP_SENT,
          },
        };
      }

      return response;
    } catch (error) {
      console.error('AuthService: Resend OTP error:', error);
      return {
        success: false,
        error: error.message || ERROR_MESSAGES.OTP_SEND_FAILED,
      };
    }
  },

  // Logout user
  logout: async () => {
    try {
      console.log('AuthService: Logout attempt');

      // For mock API
      if (apiClient === require('./apiClient').mockApiClient) {
        return await mockLogout();
      }

      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);

      // Clear tokens regardless of response (logout should always work locally)
      apiClient.utils.clearAuthTokens();

      console.log('AuthService: Logout successful');
      return {
        success: true,
        data: {
          message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
        },
      };
    } catch (error) {
      console.error('AuthService: Logout error:', error);
      // Still clear tokens even if API call fails
      apiClient.utils.clearAuthTokens();
      
      return {
        success: true, // Return success since local logout worked
        data: {
          message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
        },
      };
    }
  },

  // Refresh access token
  refreshToken: async () => {
    try {
      const refreshToken = apiClient.utils.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('AuthService: Refreshing access token');

      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
        refreshToken,
      }, { includeAuth: false });

      if (response.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Save new tokens
        apiClient.utils.saveAuthToken(accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        console.log('AuthService: Token refresh successful');
        return {
          success: true,
          data: {
            accessToken,
            refreshToken: newRefreshToken || refreshToken,
          },
        };
      }

      return response;
    } catch (error) {
      console.error('AuthService: Token refresh error:', error);
      // Clear tokens if refresh fails
      apiClient.utils.clearAuthTokens();
      
      return {
        success: false,
        error: error.message || 'Token refresh failed',
        shouldRedirectToLogin: true,
      };
    }
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      console.log('AuthService: Getting current user');

      const response = await apiClient.get(API_ENDPOINTS.USER.PROFILE);

      if (response.success) {
        console.log('AuthService: User profile retrieved');
        return {
          success: true,
          data: response.data.user,
        };
      }

      return response;
    } catch (error) {
      console.error('AuthService: Get current user error:', error);
      return {
        success: false,
        error: error.message || ERROR_MESSAGES.UNEXPECTED_ERROR,
      };
    }
  },
};

// Mock functions for development
const mockLogin = async (credentials) => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

  // Simulate different scenarios based on email
  if (credentials.email === 'error@test.com') {
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_CREDENTIALS,
    };
  }

  if (credentials.email === 'unverified@test.com') {
    return {
      success: false,
      error: ERROR_MESSAGES.ACCOUNT_NOT_VERIFIED,
    };
  }

  // Mock successful login
  const mockUser = {
    id: 'user_' + Date.now(),
    fullName: 'John Doe',
    email: credentials.email,
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  const mockTokens = {
    accessToken: 'mock_access_token_' + Date.now(),
    refreshToken: 'mock_refresh_token_' + Date.now(),
  };

  return {
    success: true,
    data: {
      user: mockUser,
      tokens: mockTokens,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    },
  };
};

const mockSignup = async (userData) => {
  await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate API delay

  // Simulate email already exists
  if (userData.email === 'existing@test.com') {
    return {
      success: false,
      error: ERROR_MESSAGES.USER_ALREADY_EXISTS,
    };
  }

  // Mock successful signup
  return {
    success: true,
    data: {
      email: userData.email,
      message: SUCCESS_MESSAGES.SIGNUP_SUCCESS,
      otpSent: true,
    },
  };
};

const mockVerifyOTP = async (email, otp) => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

  // Simulate invalid OTP
  if (otp === '000000') {
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_OTP,
    };
  }

  // Simulate expired OTP
  if (otp === '111111') {
    return {
      success: false,
      error: ERROR_MESSAGES.OTP_EXPIRED,
    };
  }

  // Mock successful verification
  const mockUser = {
    id: 'user_' + Date.now(),
    fullName: 'New User',
    email: email,
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  const mockTokens = {
    accessToken: 'mock_access_token_' + Date.now(),
    refreshToken: 'mock_refresh_token_' + Date.now(),
  };

  return {
    success: true,
    data: {
      user: mockUser,
      tokens: mockTokens,
      message: SUCCESS_MESSAGES.OTP_VERIFIED,
    },
  };
};

const mockResendOTP = async (email) => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

  return {
    success: true,
    data: {
      message: SUCCESS_MESSAGES.OTP_SENT,
    },
  };
};

const mockLogout = async () => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

  return {
    success: true,
    data: {
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    },
  };
};

export default authService;