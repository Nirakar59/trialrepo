// src/utils/validation.js

// Email validation
export const validateEmail = (email) => {
  const errors = [];
  
  if (!email) {
    errors.push("Email address is required");
    return { isValid: false, errors };
  }
  
  if (!email.trim()) {
    errors.push("Email address cannot be empty");
    return { isValid: false, errors };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    errors.push("Please enter a valid email address");
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors: [] };
};

// Password validation
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push("Password is required");
    return { isValid: false, errors };
  }
  
  // if (password.length < 8) {
  //   errors.push("Password must be at least 8 characters long");
  // }
  
  // if (!/(?=.*[a-z])/.test(password)) {
  //   errors.push("Password must contain at least one lowercase letter");
  // }
  
  // if (!/(?=.*[A-Z])/.test(password)) {
  //   errors.push("Password must contain at least one uppercase letter");
  // }
  
  // if (!/(?=.*\d)/.test(password)) {
  //   errors.push("Password must contain at least one number");
  // }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors: [] };
};

// Full name validation
export const validateFullName = (fullName) => {
  const errors = [];
  
  if (!fullName) {
    errors.push("Full name is required");
    return { isValid: false, errors };
  }
  
  if (!fullName.trim()) {
    errors.push("Full name cannot be empty");
    return { isValid: false, errors };
  }
  
  if (fullName.trim().length < 2) {
    errors.push("Full name must be at least 2 characters long");
  }
  
  if (fullName.trim().length > 50) {
    errors.push("Full name must be less than 50 characters");
  }
  
  // Only letters, spaces, hyphens, and apostrophes allowed
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(fullName.trim())) {
    errors.push("Full name can only contain letters, spaces, hyphens, and apostrophes");
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors: [] };
};

// OTP validation
export const validateOTP = (otp) => {
  const errors = [];
  
  console.log('validateOTP input:', otp, 'Type:', typeof otp, 'Length:', otp?.length); // Debug log
  
  if (!otp) {
    errors.push("Verification code is required");
    return { isValid: false, errors };
  }
  
  if (!otp.trim()) {
    errors.push("Verification code cannot be empty");
    return { isValid: false, errors };
  }
  
  const trimmedOTP = otp.trim();
  console.log('Trimmed OTP:', trimmedOTP, 'Regex test:', /^\d{6}$/.test(trimmedOTP)); // Debug log
  
  if (!/^\d{6}$/.test(trimmedOTP)) {
    errors.push("Verification code must be exactly 6 digits");
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors: [] };
};

// Form validation for login
export const validateLoginForm = (formData) => {
  const { email, password } = formData;
  const errors = {};
  let isValid = true;
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors;
    isValid = false;
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors;
    isValid = false;
  }
  
  return { isValid, errors };
};

// Form validation for signup
export const validateSignupForm = (formData) => {
  const { fullName, email, password } = formData;
  const errors = {};
  let isValid = true;
  
  const nameValidation = validateFullName(fullName);
  if (!nameValidation.isValid) {
    errors.fullName = nameValidation.errors;
    isValid = false;
  }
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors;
    isValid = false;
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors;
    isValid = false;
  }
  
  return { isValid, errors };
};