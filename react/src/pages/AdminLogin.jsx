/**
 * Admin Login Page
 * 
 * Provides JWT-based authentication for admin users.
 * Features:
 * - Email/password form with validation
 * - Password visibility toggle
 * - Password requirements checking
 * - Loading state during authentication
 * - User-friendly error messages
 * 
 * Uses Tailwind CSS for styling.
 * 
 * @module pages/admin/AdminLogin
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';
import Spinner from '../components/admin/Spinner';

/**
 * Password validation rules
 * Minimum 8 characters, must contain:
 * - Uppercase letter
 * - Lowercase letter  
 * - Number
 * - Special character
 */
const PASSWORD_RULES = {
    minLength: 8,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/
};

/**
 * Validate password against rules
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with passed rules
 */
const validatePassword = (password) => {
    return {
        isLongEnough: password.length >= PASSWORD_RULES.minLength,
        hasUppercase: PASSWORD_RULES.hasUppercase.test(password),
        hasLowercase: PASSWORD_RULES.hasLowercase.test(password),
        hasNumber: PASSWORD_RULES.hasNumber.test(password),
        hasSymbol: PASSWORD_RULES.hasSymbol.test(password)
    };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export default function AdminLogin() {
    const navigate = useNavigate();
    const { login, isAuthenticated, isLoading: authLoading, error: authError, clearError } = useAdminAuth();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [touched, setTouched] = useState({ email: false, password: false });

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Clear auth error when form changes
    useEffect(() => {
        if (authError) {
            clearError();
        }
    }, [email, password]); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Validate form fields
     * @returns {boolean} Is form valid
     */
    const validateForm = () => {
        const errors = {};

        // Email validation
        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!isValidEmail(email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!password) {
            errors.password = 'Password is required';
        } else {
            const passwordCheck = validatePassword(password);
            const allPassed = Object.values(passwordCheck).every(Boolean);

            if (!allPassed) {
                errors.password = 'Password does not meet requirements';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mark all fields as touched
        setTouched({ email: true, password: true });

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        // Attempt login
        const result = await login(email.trim(), password);

        setIsSubmitting(false);

        if (result.success) {
            // Navigate to dashboard on success
            navigate('/admin/dashboard', { replace: true });
        }
        // Error is handled by useAdminAuth hook
    };

    /**
     * Handle field blur (mark as touched)
     */
    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateForm();
    };

    // Password validation status for display
    const passwordValidation = password ? validatePassword(password) : null;

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2942] to-[#0d1421] p-5">
                <div className="flex flex-col items-center justify-center">
                    <Spinner size="large" text="Checking authentication..." />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2942] to-[#0d1421] p-5 max-sm:p-0 max-sm:items-stretch">
            <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden max-sm:max-w-full max-sm:min-h-screen max-sm:rounded-none max-sm:flex max-sm:flex-col">
                {/* Logo/Brand */}
                <div className="bg-gradient-to-br from-[#1a2942] to-[#2d4263] py-8 px-6 text-center text-white">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-[32px]">🛡️</span>
                        <h1 className="text-2xl font-bold text-white m-0">Admin Panel</h1>
                    </div>
                    <p className="text-sm text-white/70 m-0">Nimonspedia Administration</p>
                </div>

                {/* Login Form */}
                <form className="p-8 max-sm:flex-1 max-sm:flex max-sm:flex-col max-sm:justify-center" onSubmit={handleSubmit} noValidate>
                    {/* Auth Error Alert */}
                    {authError && (
                        <div className="flex items-center gap-3 py-3 px-4 bg-red-50 border border-red-200 rounded-lg mb-5 text-red-800 text-sm" role="alert">
                            <span className="text-lg shrink-0">⚠</span>
                            <span>{authError}</span>
                        </div>
                    )}

                    {/* Email Field */}
                    <div className="mb-5">
                        <label
                            htmlFor="email"
                            className={`block text-sm font-semibold mb-2 ${touched.email && formErrors.email ? 'text-error-red' : 'text-text-dark'}`}
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            className={`w-full py-3 px-4 text-[15px] font-sans border-[1.5px] rounded-lg bg-white text-text-dark outline-none transition-all placeholder:text-text-light focus:border-primary-green focus:shadow-[0_0_0_3px_rgba(3,172,14,0.1)] disabled:bg-background-gray disabled:cursor-not-allowed ${touched.email && formErrors.email ? 'border-error-red' : 'border-border-color'}`}
                            placeholder="admin@nimonspedia.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => handleBlur('email')}
                            disabled={isSubmitting}
                            autoComplete="email"
                            autoFocus
                        />
                        {touched.email && formErrors.email && (
                            <span className="block text-[13px] text-error-red mt-1.5">{formErrors.email}</span>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="mb-5">
                        <label
                            htmlFor="password"
                            className={`block text-sm font-semibold mb-2 ${touched.password && formErrors.password ? 'text-error-red' : 'text-text-dark'}`}
                        >
                            Password
                        </label>
                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                className={`w-full py-3 px-4 pr-[50px] text-[15px] font-sans border-[1.5px] rounded-lg bg-white text-text-dark outline-none transition-all placeholder:text-text-light focus:border-primary-green focus:shadow-[0_0_0_3px_rgba(3,172,14,0.1)] disabled:bg-background-gray disabled:cursor-not-allowed ${touched.password && formErrors.password ? 'border-error-red' : 'border-border-color'}`}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => handleBlur('password')}
                                disabled={isSubmitting}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="absolute right-3 bg-transparent border-none text-lg cursor-pointer p-1 opacity-70 transition-opacity hover:opacity-100"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {touched.password && formErrors.password && (
                            <span className="block text-[13px] text-error-red mt-1.5">{formErrors.password}</span>
                        )}

                        {/* Password Requirements */}
                        {password && touched.password && (
                            <div className="mt-3 p-3 bg-background-gray rounded-lg">
                                <p className="text-xs font-semibold text-text-medium m-0 mb-2">Password must contain:</p>
                                <ul className="list-none p-0 m-0 grid grid-cols-2 gap-x-3 gap-y-1 max-sm:grid-cols-1">
                                    <li className={`text-xs flex items-center gap-1 ${passwordValidation?.isLongEnough ? 'text-success-green' : 'text-text-light'}`}>
                                        {passwordValidation?.isLongEnough ? '✓' : '○'} At least 8 characters
                                    </li>
                                    <li className={`text-xs flex items-center gap-1 ${passwordValidation?.hasUppercase ? 'text-success-green' : 'text-text-light'}`}>
                                        {passwordValidation?.hasUppercase ? '✓' : '○'} Uppercase letter (A-Z)
                                    </li>
                                    <li className={`text-xs flex items-center gap-1 ${passwordValidation?.hasLowercase ? 'text-success-green' : 'text-text-light'}`}>
                                        {passwordValidation?.hasLowercase ? '✓' : '○'} Lowercase letter (a-z)
                                    </li>
                                    <li className={`text-xs flex items-center gap-1 ${passwordValidation?.hasNumber ? 'text-success-green' : 'text-text-light'}`}>
                                        {passwordValidation?.hasNumber ? '✓' : '○'} Number (0-9)
                                    </li>
                                    <li className={`text-xs flex items-center gap-1 ${passwordValidation?.hasSymbol ? 'text-success-green' : 'text-text-light'}`}>
                                        {passwordValidation?.hasSymbol ? '✓' : '○'} Symbol (!@#$%^&*)
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-3.5 px-6 text-base font-semibold font-sans bg-gradient-to-br from-primary-green to-[#028a0c] text-white border-none rounded-lg cursor-pointer transition-all mt-2 hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_4px_12px_rgba(3,172,14,0.3)] active:enabled:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2.5">
                                <Spinner size="small" color="#ffffff" />
                                <span>Signing in...</span>
                            </span>
                        ) : (
                            'Sign In to Admin Panel'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="px-6 pb-6 text-center">
                    <a href="/" className="text-sm text-text-medium no-underline transition-colors hover:text-primary-green">
                        ← Back to Main Site
                    </a>
                </div>
            </div>
        </div>
    );
}
