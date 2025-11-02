import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets.js';
import { Star, Eye, EyeOff, Loader2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { ROUTES, FORM_FIELDS } from '../../utils/constants';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    login,
    isLoading,
    error,
    successMessage,
    rememberEmail,
    clearMessages,
    setRememberEmail,
    isAuthenticated,
  } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    email: rememberEmail || '',
    password: '',
    rememberEmail: !!rememberEmail,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = new URLSearchParams(location.search).get('redirect') || ROUTES.DASHBOARD;
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, location]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }

    // Clear general error message
    if (error) {
      clearMessages();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setFieldErrors({});

    try {
      const result = await login(formData, {
        redirectTo: new URLSearchParams(location.search).get('redirect'),
      });

      if (!result.success && result.errors) {
        // Handle field-specific errors
        setFieldErrors(result.errors);
      }
    } catch (error) {
      console.error('Login submission error:', error);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className='min-h-screen flex flex-col md:flex-row'>
      {/*Background Image */}
      <img src={assets.bgImage} alt="" className='absolute top-0 left-0 -z-10 w-full h-full object-cover'/>
       
      {/*Left side: Branding - EXACT COPY FROM OLD LOGIN*/}
      <div className='flex-1 flex flex-col items-start justify-between p-6 md:p-10 lg:pl-40'>
        <img src="" alt="" className='h-12 object-contain' />
        <div>
          <div className='flex items-center gap-3 mb-4 max-md:mt-10'>
                <img src={assets.group_users} alt="" className='h-8 md:h-10'/>
                <div>
                     <div className='flex'>
                          {Array(5).fill(0).map((_, i)=>(<Star key={i} className='size-4 md:size-4.5 text-transparent fill-amber-500'/>))}
                     </div>
                     <p>Used by 12k+ Users</p>
                </div>
          </div>
          <h1 className='text-3xl md:text-6xl md:pb-2 font-bold bg-gradient-to-r from-indigo-950 to-indigo-800 bg-clip-text text-transparent'>More than just friends truly connect</h1>
          <p className='text-xl md:text-3xl text-indigo-900 max-w-72 md:max-w-md'>connect with local community on sangal_chakra</p>
        </div>
        <span className='md:h-10'></span>
      </div>

      {/* Right side: Custom Login Form - YOUR NEW AUTH SETUP */}
      <div className='flex-1 flex items-center justify-center p-6 sm:p-10'>
        <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Sign in to Sanjal_Chakra
            </h2>
            <p className="text-gray-400">
              Welcome back! Please sign in to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-3 bg-green-900/20 border border-green-500 rounded-lg">
              <p className="text-green-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                {FORM_FIELDS.EMAIL.label}
              </label>
              <input
                type={FORM_FIELDS.EMAIL.type}
                id="email"
                name={FORM_FIELDS.EMAIL.name}
                value={formData.email}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={FORM_FIELDS.EMAIL.placeholder}
                className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  fieldErrors.email ? 'border-red-500' : 'border-gray-700'
                }`}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-400">
                  {fieldErrors.email[0]}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                {FORM_FIELDS.PASSWORD.label}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name={FORM_FIELDS.PASSWORD.name}
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={FORM_FIELDS.PASSWORD.placeholder}
                  className={`w-full px-3 py-2 pr-10 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-700'
                  }`}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-2 text-gray-400 hover:text-gray-300 focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-400">
                  {fieldErrors.password[0]}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberEmail"
                name="rememberEmail"
                checked={formData.rememberEmail}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 bg-gray-800 rounded"
                disabled={isLoading}
              />
              <label htmlFor="rememberEmail" className="ml-2 block text-sm text-gray-300">
                Remember my email address
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                <>
                  Continue
                  <span className="ml-1">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link 
                to={ROUTES.SIGNUP}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
            <p className="text-gray-400">
              Forgot your password?{' '}
              <Link 
                to={ROUTES.FORGOT_PASSWORD}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Reset it
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;