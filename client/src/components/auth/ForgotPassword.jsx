import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Star } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { ROUTES, FORM_FIELDS } from '../../utils/constants';
import { assets } from '../../assets/assets.js';
import API from '../../api/api.js';
const ForgotPassword = () => {
    const navigate = useNavigate();
    const { isLoading, error, successMessage, clearMessages } = useAuth();
    const [email, setEmail] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleInputChange = (e) => {
        setEmail(e.target.value);
        if (fieldErrors.email) {
            setFieldErrors({ email: null });
        }
        if (error) {
            clearMessages();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearMessages();
        setFieldErrors({});

        const result = await API.post('/auth/forgotpassword', { email });
        if (!result.success && result.errors) {
            setFieldErrors(result.errors);
        }
        if (result.data) {
            const email = result.data?.data?.email;
            const reSetOtp = result.data?.data?.reSetOtp;
            navigate(`/reset-password?email=${email}&code=${reSetOtp}`);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div className='min-h-screen flex flex-col md:flex-row'>
            <img src={assets.bgImage} alt="" className='absolute top-0 left-0 -z-10 w-full h-full object-cover' />
            {/* Left side: Branding */}
            <div className='flex-1 flex flex-col items-start justify-between p-6 md:p-10 lg:pl-40'>
                <img src="" alt="" className='h-12 object-contain' />
                <div>
                    <div className='flex items-center gap-3 mb-4 max-md:mt-10'>
                        <img src={assets.group_users} alt="" className='h-8 md:h-10' />
                        <div>
                            <div className='flex'>
                                {Array(5).fill(0).map((_, i) => (
                                    <Star key={i} className='size-4 md:size-4.5 text-transparent fill-amber-500' />
                                ))}
                            </div>
                            <p>Used by 12k+ Users</p>
                        </div>
                    </div>
                    <h1 className='text-3xl md:text-6xl md:pb-2 font-bold bg-gradient-to-r from-indigo-950 to-indigo-800 bg-clip-text text-transparent'>
                        More than just friends truly connect
                    </h1>
                    <p className='text-xl md:text-3xl text-indigo-900 max-w-72 md:max-w-md'>
                        connect with global community on sangal_chakra
                    </p>
                </div>
                <span className='md:h-10'></span>
            </div>

            {/* Right side: Forgot Password Form */}
            <div className='flex-1 flex items-center justify-center p-6 sm:p-10'>
                <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-2">
                            Forgot Password
                        </h2>
                        <p className="text-gray-400">
                            Enter your email to receive a password reset link
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 p-3 bg-green-900/20 border border-green-500 rounded-lg">
                            <p className="text-green-400 text-sm">{successMessage}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                {FORM_FIELDS.EMAIL.label}
                            </label>
                            <input
                                type={FORM_FIELDS.EMAIL.type}
                                id="email"
                                name={FORM_FIELDS.EMAIL.name}
                                value={email}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder={FORM_FIELDS.EMAIL.placeholder}
                                className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${fieldErrors.email ? 'border-red-500' : 'border-gray-700'
                                    }`}
                                disabled={isLoading}
                                autoComplete="email"
                                autoFocus
                            />
                            {fieldErrors.email && (
                                <p className="mt-1 text-sm text-red-400">{fieldErrors.email[0]}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    Send Reset Link
                                    <span className="ml-1">→</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            Back to{' '}
                            <Link
                                to={ROUTES.LOGIN}
                                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;