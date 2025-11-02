// src/components/auth/OTPVerification.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useOTP from '../../hooks/useOTP';
import { ROUTES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../utils/constants';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, resendOTP, isLoading, error, successMessage, clearMessages, isAuthenticated } = useAuth();
  
  // Get email from location state or redirect to signup
  const email = location.state?.email || localStorage.getItem('otp_email');
  console.log('OTP Email received:', email, 'Location state:', location.state); // Debug log
  
  const [resendAttempts, setResendAttempts] = useState(0);
  const [showResendLimit, setShowResendLimit] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate(ROUTES.SIGNUP, { replace: true });
      return;
    }
  }, [email, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigate]);

  // OTP Hook configuration
  const {
    getInputProps,
    isComplete,
    canResend,
    resendCountdown,
    startResendCountdown,
    clearOTP
  } = useOTP({
    onComplete: async (otpValue) => {
      console.log('Auto-submitting OTP:', otpValue); // Debug log
      
      // Check for dev mode test codes first
      if (process.env.NODE_ENV === 'development') {
        if (otpValue === '123456') {
          console.log('Using dev success code');
          // Simulate success
          navigate(ROUTES.DASHBOARD);
          return;
        } else if (otpValue === '000000') {
          console.log('Using dev invalid code');
          // Show error message
          clearMessages();
          // You might want to set a custom error here
          clearOTP()
          return;
        } else if (otpValue === '111111') {
          console.log('Using dev expired code');
          // Show expired message
          clearMessages();
          clearOTP()
          return;
        }
      }

      // Regular OTP verification
      try {
        const result = await verifyOTP(email, otpValue);
        if (!result.success) {
          clearOTP()
        }
      } catch (err) {
        console.error('OTP verification error:', err);
        clearOTP()
      }
    },
    autoSubmit: true,
    maxAttempts: 3
  });

  // Clear messages after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearMessages(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearMessages]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => clearMessages(), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, clearMessages]);

  const handleResendOTP = async () => {
    if (!canResend || resendAttempts >= 3) {
      setShowResendLimit(true);
      return;
    }

    try {
      const result = await resendOTP(email);
      if (result.success) {
        setResendAttempts(prev => prev + 1);
        startResendCountdown();
        clearOTP()
        
        if (resendAttempts >= 2) {
          setShowResendLimit(true);
        }
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      // Error handled by useAuth hook
    }
  };

  const handleManualVerify = async () => {
    if (!isComplete) return;
    
    const otpValue = Array.from({ length: 6 }, (_, i) => 
      getInputProps(i).value
    ).join('');
    
    console.log('Manual verification OTP:', otpValue); // Debug log

    // Check for dev mode test codes first
    if (process.env.NODE_ENV === 'development') {
      if (otpValue === '123456') {
        console.log('Dev mode: Success code entered');
        navigate(ROUTES.DASHBOARD);
        return;
      } else if (otpValue === '000000') {
        console.log('Dev mode: Invalid code entered');
        // Set custom error or use existing error state
        clearOTP()
        return;
      } else if (otpValue === '111111') {
        console.log('Dev mode: Expired code entered');
        clearOTP()
        return;
      }
    }
    
    try {
      const result = await verifyOTP(email,otpValue);
      if (!result.success) {
        clearOTP()
      }
    } catch (err) {
      console.error('Manual OTP verification error:', err);
      clearOTP()
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isComplete) {
      handleManualVerify();
    }
  };

  if (!email) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Gradient - Same as signup page */}
      <div 
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      />

      {/* Centered OTP Form - Same structure as signup */}
      <div className="flex items-center justify-center p-6 sm:p-10 relative z-10 w-full">
        <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Check your email
            </h2>
            <p className="text-gray-400 mb-1">
              We sent a verification code to
            </p>
            <p className="text-white font-medium">
              {email}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-3 bg-green-900/20 border border-green-500 rounded-lg">
              <p className="text-green-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Resend Limit Warning */}
          {showResendLimit && (
            <div className="mb-6 p-3 bg-yellow-900/20 border border-yellow-500 rounded-lg">
              <p className="text-yellow-400 text-sm">
                Maximum resend attempts reached. Please try again later or contact support.
              </p>
            </div>
          )}

          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
              Enter verification code
            </label>
            <div className="flex justify-center space-x-3 mb-4">
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={index}
                  {...getInputProps(index)}
                  onKeyPress={handleKeyPress}
                  className={`w-12 h-12 text-center text-lg font-semibold bg-gray-800 border-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    error 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : successMessage
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                      : 'border-gray-700'
                  }`}
                  maxLength={1}
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Manual Verify Button (backup for auto-submit) */}
            {isComplete && !isLoading && (
              <button
                onClick={handleManualVerify}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors mb-4"
              >
                Verify Code
                <span className="ml-2">→</span>
              </button>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center mb-4">
                <Loader2 className="animate-spin h-6 w-6 text-indigo-400" />
              </div>
            )}
          </div>

          {/* Resend Section */}
          <div className="text-center mb-6">
            {canResend && resendAttempts < 3 ? (
              <button
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
              >
                Resend code
              </button>
            ) : resendAttempts < 3 ? (
              <p className="text-sm text-gray-400">
                Resend code in {resendCountdown}s
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Maximum resend attempts reached
              </p>
            )}
            
            {resendAttempts > 0 && resendAttempts < 3 && (
              <p className="text-xs text-gray-500 mt-1">
                {3 - resendAttempts} attempts remaining
              </p>
            )}
          </div>

          {/* Back to Signup */}
          <div className="flex items-center justify-center">
            <Link
              to={ROUTES.SIGNUP}
              className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign up
            </Link>
          </div>
        </div>
      </div>


    </div>
  );
};

export default OTPVerification;