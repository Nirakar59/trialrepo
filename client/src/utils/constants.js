// src/utils/constants.js

// Auth states
export const AUTH_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  OTP_PENDING: 'otp_pending',
  OTP_VERIFIED: 'otp_verified'
};

// API endpoints (will be replaced with real backend URLs later)
export const API_ENDPOINTS = {
  BASE_URL: 'http://localhost:3001/api', // Change this to your backend URL
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/update'
  }
};

// Error messages
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  USER_NOT_FOUND: 'No account found with this email address.',
  USER_ALREADY_EXISTS: 'An account with this email already exists.',
  ACCOUNT_NOT_VERIFIED: 'Please verify your email address to continue.',
  
  // OTP errors
  INVALID_OTP: 'Invalid verification code. Please try again.',
  OTP_EXPIRED: 'Verification code has expired. Please request a new one.',
  OTP_SEND_FAILED: 'Failed to send verification code. Please try again.',
  TOO_MANY_OTP_REQUESTS: 'Too many requests. Please wait before requesting another code.',
  
  // Form validation errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  WEAK_PASSWORD: 'Password does not meet security requirements.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  
  // Generic errors
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  MAINTENANCE_MODE: 'Service is currently under maintenance. Please try again later.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  SIGNUP_SUCCESS: 'Account created successfully! Please verify your email.',
  LOGIN_SUCCESS: 'Welcome back! You have been successfully logged in.',
  OTP_SENT: 'Verification code sent to your email address.',
  OTP_VERIFIED: 'Email verified successfully!',
  PASSWORD_RESET_SENT: 'Password reset instructions sent to your email.',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully. You can now log in.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  LOGOUT_SUCCESS: 'You have been logged out successfully.'
};

// Form field configurations
export const FORM_FIELDS = {
  FULL_NAME: {
    name: 'fullName',
    label: 'Full name',
    placeholder: 'Enter your full name',
    type: 'text',
    required: true
  },
  EMAIL: {
    name: 'email',
    label: 'Email address',
    placeholder: 'Enter your email address',
    type: 'email',
    required: true
  },
  PASSWORD: {
    name: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    required: true
  },
  OTP: {
    name: 'otp',
    label: 'Verification code',
    placeholder: 'Enter 6-digit code',
    type: 'text',
    required: true,
    maxLength: 6
  }
};

// OTP configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  RESEND_COOLDOWN_SECONDS: 60,
  MAX_ATTEMPTS: 3
};

// Token configuration
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_DATA_KEY: 'user_data',
  TOKEN_EXPIRY_BUFFER_MINUTES: 5 // Refresh token 5 minutes before expiry
};

// UI configuration
export const UI_CONFIG = {
  LOADING_DELAY_MS: 300, // Minimum loading time for better UX
  AUTO_REDIRECT_DELAY_MS: 2000, // Delay before auto redirect after success
  TOAST_DURATION_MS: 4000, // Duration for toast messages
  OTP_AUTO_SUBMIT_DELAY_MS: 500 // Delay before auto-submitting complete OTP
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  OTP_VERIFICATION: '/verify-otp',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile'
};

// Regex patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  FULL_NAME: /^[a-zA-Z\s\-']{2,50}$/,
  OTP: /^\d{6}$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'sanjal_auth_token',
  REFRESH_TOKEN: 'sanjal_refresh_token',
  USER_DATA: 'sanjal_user_data',
  REMEMBER_EMAIL: 'sanjal_remember_email',
  THEME_PREFERENCE: 'sanjal_theme',
  LANGUAGE_PREFERENCE: 'sanjal_language'
};