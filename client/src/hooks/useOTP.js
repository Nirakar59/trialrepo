// src/hooks/useOTP.js

import { useState, useEffect, useRef } from 'react';
import { OTP_CONFIG } from '../utils/constants';
import { validateOTP } from '../utils/validation';

const useOTP = (options = {}) => {
  const {
    autoSubmit = true,
    autoFocus = true,
    onComplete,
    onError,
    length = OTP_CONFIG.LENGTH,
  } = options;

  // State
  const [otpValues, setOtpValues] = useState(new Array(length).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [attempts, setAttempts] = useState(0);

  // Refs for input elements
  const inputRefs = useRef([]);
  const resendIntervalRef = useRef(null);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Handle OTP input change
 const handleChange = (index, value) => {
  // Only allow digits
  if (!/^\d*$/.test(value)) return;

  const newOtpValues = [...otpValues];
  
  // Handle single digit input
  if (value.length <= 1) {
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Move to next input if value is entered
    if (value && index < length - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  }
  // Handle paste operation
  else if (value.length > 1) {
    const pastedValues = value.slice(0, length).split('');
    for (let i = 0; i < length; i++) {
      newOtpValues[i] = pastedValues[i] || '';
    }
    setOtpValues(newOtpValues);
    
    // Focus last filled input or last input
    const lastFilledIndex = Math.min(pastedValues.length - 1, length - 1);
    setActiveIndex(lastFilledIndex);
    inputRefs.current[lastFilledIndex]?.focus();
  }

  // Check if OTP is complete
  const isOtpComplete = newOtpValues.every(digit => digit !== '');
  setIsComplete(isOtpComplete);

  // Auto-submit if complete, autoSubmit is enabled, and OTP is valid
  if (isOtpComplete && autoSubmit && onComplete) {
    const otpString = newOtpValues.join('');
    const validationResult = validateOTP(otpString); // Validate OTP
    if (validationResult.isValid) {
      setTimeout(() => {
        onComplete(otpString);
      }, 100); // Small delay for better UX
    } else {
      // Optionally handle invalid OTP (e.g., set error state)
      if (onError) {
        onError(validationResult.errors);
      }
    }
  }
};

  // Handle key down events
  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtpValues = [...otpValues];
      
      if (otpValues[index]) {
        // Clear current input if it has value
        newOtpValues[index] = '';
        setOtpValues(newOtpValues);
      } else if (index > 0) {
        // Move to previous input and clear it
        newOtpValues[index - 1] = '';
        setOtpValues(newOtpValues);
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
      setIsComplete(false);
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
    // Handle Enter key
    else if (e.key === 'Enter' && isComplete && onComplete) {
      onComplete(otpValues.join(''));
    }
  };

  // Handle input focus
  const handleFocus = (index) => {
    setActiveIndex(index);
    // Select all text in input for easy replacement
    inputRefs.current[index]?.select();
  };

  // Handle paste event
  const handlePaste = (e) => {
  e.preventDefault();
  const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
  
  if (pastedData) {
    const pastedValues = pastedData.slice(0, length).split('');
    const newOtpValues = new Array(length).fill('');
    
    for (let i = 0; i < Math.min(pastedValues.length, length); i++) {
      newOtpValues[i] = pastedValues[i];
    }
    
    setOtpValues(newOtpValues);
    const isOtpComplete = newOtpValues.every(digit => digit !== '');
    setIsComplete(isOtpComplete);
    
    // Validate pasted OTP before auto-submitting
    if (isOtpComplete && autoSubmit && onComplete) {
      const otpString = newOtpValues.join('');
      const validationResult = validateOTP(otpString);
      if (validationResult.isValid) {
        setTimeout(() => {
          onComplete(otpString);
        }, 100);
      } else if (onError) {
        onError(validationResult.errors);
      }
    }
    
    // Focus appropriate input
    const lastFilledIndex = Math.min(pastedValues.length - 1, length - 1);
    setActiveIndex(lastFilledIndex);
    inputRefs.current[lastFilledIndex]?.focus();
  }
};

  // Get OTP string
  const getOTPValue = () => {
    return otpValues.join('');
  };

  // Clear OTP
  const clearOTP = () => {
    setOtpValues(new Array(length).fill(''));
    setActiveIndex(0);
    setIsComplete(false);
    setAttempts(prev => prev + 1);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  // Validate current OTP
  const validateCurrentOTP = () => {
    const otpString = getOTPValue();
    return validateOTP(otpString);
  };

  // Start resend countdown
  const startResendCountdown = (seconds = OTP_CONFIG.RESEND_COOLDOWN_SECONDS) => {
    setCanResend(false);
    setResendTimer(seconds);

    resendIntervalRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(resendIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Format timer display
  const getTimerDisplay = () => {
    if (resendTimer <= 0) return '';
    const minutes = Math.floor(resendTimer / 60);
    const seconds = resendTimer % 60;
    return minutes > 0 
      ? `${minutes}:${seconds.toString().padStart(2, '0')}`
      : `${seconds}s`;
  };

  // Check if max attempts reached
  const isMaxAttemptsReached = () => {
    return attempts >= OTP_CONFIG.MAX_ATTEMPTS;
  };

  // Reset attempts
  const resetAttempts = () => {
    setAttempts(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
      }
    };
  }, []);

  // Input props generator for easier usage
  const getInputProps = (index) => ({
    ref: (el) => (inputRefs.current[index] = el),
    value: otpValues[index],
    onChange: (e) => handleChange(index, e.target.value),
    onKeyDown: (e) => handleKeyDown(index, e),
    onFocus: () => handleFocus(index),
    onPaste: handlePaste,
    maxLength: 1,
    type: 'text',
    inputMode: 'numeric',
    pattern: '[0-9]*',
    autoComplete: 'one-time-code',
    'aria-label': `Digit ${index + 1} of ${length}`,
    className: `otp-input ${activeIndex === index ? 'active' : ''} ${otpValues[index] ? 'filled' : ''}`,
  });

  return {
    // State
    otpValues,
    activeIndex,
    isComplete,
    resendTimer,
    canResend,
    attempts,

    // Actions
    handleChange,
    handleKeyDown,
    handleFocus,
    handlePaste,
    clearOTP,
    startResendCountdown,
    resetAttempts,

    // Getters
    getOTPValue,
    getTimerDisplay,
    getInputProps,
    validateCurrentOTP,

    // Computed values
    isMaxAttemptsReached: isMaxAttemptsReached(),
    isValidOTP: isComplete && validateCurrentOTP().isValid,
    progress: (otpValues.filter(val => val !== '').length / length) * 100,
  };
};

export default useOTP;