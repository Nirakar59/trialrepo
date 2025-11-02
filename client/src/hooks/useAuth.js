// src/hooks/useAuth.js

import { useAuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES, SUCCESS_MESSAGES } from '../utils/constants';
import { validateLoginForm, validateSignupForm, validateOTP } from '../utils/validation';

const useAuth = () => {
  const authContext = useAuthContext();
  const navigate = useNavigate();

  const {
    // State
    user,
    isAuthenticated,
    isLoading,
    authState,
    error,
    successMessage,
    pendingVerificationEmail,
    rememberEmail,
    
    // Context actions
    login: contextLogin,
    signup: contextSignup,
    logout: contextLogout,
    verifyOTP: contextVerifyOTP,
    resendOTP: contextResendOTP,
    setError,
    setSuccessMessage,
    clearMessages,
    setRememberEmail,
  } = authContext;

  // Enhanced login function with validation and navigation
  const login = async (formData, options = {}) => {
    try {
      // Clear any existing messages
      clearMessages();

      // Validate form data
      const validation = validateLoginForm(formData);
      if (!validation.isValid) {
        // Set first error found
        const firstError = Object.values(validation.errors)[0][0];
        setError(firstError);
        return { success: false, errors: validation.errors };
      }
      const response = await login(email, password);
      response.formData;

      // Perform login
      const result = await contextLogin({
        email: formData.email,
        password: formData.password,
        rememberEmail: formData.rememberEmail || false,
      });

      if (result.success) {
        setSuccessMessage(SUCCESS_MESSAGES.LOGIN_SUCCESS);
        
        // Navigate after successful login
        const redirectTo = options.redirectTo || ROUTES.DASHBOARD;
        setTimeout(() => {
          navigate(redirectTo);
        }, 1000); // Small delay to show success message
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      return { success: false, error: error.message };
    }
  };

  // Enhanced signup function with validation and navigation
const signup = async (formData) => {
  try {
    // Clear any existing messages
    clearMessages();

    // Validate form data
    const validation = validateSignupForm(formData);
    if (!validation.isValid) {
      // Set first error found
      const firstError = Object.values(validation.errors)[0][0];
      setError(firstError);
      return { success: false, errors: validation.errors };
    }

    // Perform signup
    const result = await contextSignup({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
    });

    // DEBUG: Let's see what the result actually contains
    console.log('Signup result:', result);
    console.log('Result success:', result.success);
    console.log('Result error:', result.error);
    console.log('Result errors:', result.errors);

    // Check if signup was successful (account created)
    // Sometimes the result might not have .success but still be successful
    if (result.success || (!result.error && !result.errors)) {
      setSuccessMessage(SUCCESS_MESSAGES.SIGNUP_SUCCESS);
      
      // Navigate to OTP verification
      setTimeout(() => {
        navigate(ROUTES.OTP_VERIFICATION);
      }, 1500);
      
      return { success: true };
    }

    return result;
  } catch (error) {
    console.error('Signup error:', error);
    setError(error.message || 'Signup failed');
    return { success: false, error: error.message };
  }
};

  // Enhanced OTP verification with validation
  const verifyOTP = async (email, otpValue) => {
    try {
      // Clear any existing messages
      clearMessages();

      // Validate OTP
      const validation = validateOTP(otpValue);
      if (!validation.isValid) {
        setError(validation.errors[0]);
        return { success: false, errors: validation.errors };
      }

      // Perform OTP verification
      const result = await contextVerifyOTP(email, otpValue);

      if (result.success) {
        setSuccessMessage(SUCCESS_MESSAGES.OTP_VERIFIED);
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate(ROUTES.DASHBOARD);
        }, 1500);
      }

      return result;
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.message || 'OTP verification failed');
      return { success: false, error: error.message };
    }
  };

  // Enhanced resend OTP function
  const resendOTP = async () => {
    try {
      if (!pendingVerificationEmail) {
        setError('No pending verification found. Please sign up again.');
        return { success: false, error: 'No pending verification' };
      }

      const result = await contextResendOTP(pendingVerificationEmail);
      
      if (result.success) {
        setSuccessMessage(SUCCESS_MESSAGES.OTP_SENT);
      }

      return result;
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError(error.message || 'Failed to resend OTP');
      return { success: false, error: error.message };
    }
  };

  // Enhanced logout with navigation
  const logout = async (options = {}) => {
    try {
      const result = await contextLogout();
      
      if (result.success) {
        if (!options.silent) {
          setSuccessMessage(SUCCESS_MESSAGES.LOGOUT_SUCCESS);
        }
        
        // Navigate to login page
        const redirectTo = options.redirectTo || ROUTES.LOGIN;
        navigate(redirectTo);
      }

      return result;
    } catch (error) {
      console.error('Logout error:', error);
      if (!options.silent) {
        setError(error.message || 'Logout failed');
      }
      return { success: false, error: error.message };
    }
  };

  // Check if user has specific permissions (future enhancement)
  const hasPermission = (permission) => {
    if (!isAuthenticated || !user) return false;
    // Add permission logic here when needed
    return true;
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return '';
    return user.fullName || user.email || 'User';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.fullName) return 'U';
    return user.fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if current route requires authentication
  const requiresAuth = (pathname) => {
    const publicRoutes = [ROUTES.LOGIN, ROUTES.SIGNUP, ROUTES.OTP_VERIFICATION, ROUTES.FORGOT_PASSWORD];
    return !publicRoutes.includes(pathname);
  };

  // Redirect to login if not authenticated
  const redirectToLogin = (currentPath) => {
    navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(currentPath)}`);
  };

  // Auto-clear messages after timeout
  const clearMessagesWithTimeout = (timeout = 5000) => {
    setTimeout(() => {
      clearMessages();
    }, timeout);
  };

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    authState,
    error,
    successMessage,
    pendingVerificationEmail,
    rememberEmail,

    // Enhanced actions
    login,
    signup,
    logout,
    verifyOTP,
    resendOTP,

    // Helper functions
    hasPermission,
    getUserDisplayName,
    getUserInitials,
    requiresAuth,
    redirectToLogin,

    // Message management
    setError,
    setSuccessMessage,
    clearMessages,
    clearMessagesWithTimeout,
    setRememberEmail,

    // Computed values
    isLoggedIn: isAuthenticated && !!user,
    isEmailPending: !!pendingVerificationEmail,
    userName: getUserDisplayName(),
    userInitials: getUserInitials(),
  };
};

export default useAuth;