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
 * @module pages/admin/AdminLogin
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../../hooks/useAdminAuth';
import Spinner from '../../components/common/Spinner';
import './AdminLogin.css';

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
            <div className="admin-login-page">
                <div className="login-loading">
                    <Spinner size="large" text="Checking authentication..." />
                </div>
            </div>
        );
    }

    return (
        <div className="admin-login-page">
            <div className="login-container">
                {/* Logo/Brand */}
                <div className="login-header">
                    <div className="login-logo">
                        <span className="logo-icon">🛡️</span>
                        <h1>Admin Panel</h1>
                    </div>
                    <p className="login-subtitle">Nimonspedia Administration</p>
                </div>

                {/* Login Form */}
                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    {/* Auth Error Alert */}
                    {authError && (
                        <div className="login-error-alert" role="alert">
                            <span className="error-icon">⚠</span>
                            <span>{authError}</span>
                        </div>
                    )}

                    {/* Email Field */}
                    <div className={`form-group ${touched.email && formErrors.email ? 'has-error' : ''}`}>
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            placeholder="admin@nimonspedia.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => handleBlur('email')}
                            disabled={isSubmitting}
                            autoComplete="email"
                            autoFocus
                        />
                        {touched.email && formErrors.email && (
                            <span className="form-error">{formErrors.email}</span>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className={`form-group ${touched.password && formErrors.password ? 'has-error' : ''}`}>
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => handleBlur('password')}
                                disabled={isSubmitting}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {touched.password && formErrors.password && (
                            <span className="form-error">{formErrors.password}</span>
                        )}

                        {/* Password Requirements */}
                        {password && touched.password && (
                            <div className="password-requirements">
                                <p className="requirements-title">Password must contain:</p>
                                <ul className="requirements-list">
                                    <li className={passwordValidation?.isLongEnough ? 'valid' : 'invalid'}>
                                        {passwordValidation?.isLongEnough ? '✓' : '○'} At least 8 characters
                                    </li>
                                    <li className={passwordValidation?.hasUppercase ? 'valid' : 'invalid'}>
                                        {passwordValidation?.hasUppercase ? '✓' : '○'} Uppercase letter (A-Z)
                                    </li>
                                    <li className={passwordValidation?.hasLowercase ? 'valid' : 'invalid'}>
                                        {passwordValidation?.hasLowercase ? '✓' : '○'} Lowercase letter (a-z)
                                    </li>
                                    <li className={passwordValidation?.hasNumber ? 'valid' : 'invalid'}>
                                        {passwordValidation?.hasNumber ? '✓' : '○'} Number (0-9)
                                    </li>
                                    <li className={passwordValidation?.hasSymbol ? 'valid' : 'invalid'}>
                                        {passwordValidation?.hasSymbol ? '✓' : '○'} Symbol (!@#$%^&*)
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="login-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="btn-spinner">
                                <Spinner size="small" color="#ffffff" />
                                <span>Signing in...</span>
                            </span>
                        ) : (
                            'Sign In to Admin Panel'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="login-footer">
                    <a href="/" className="back-link">
                        ← Back to Main Site
                    </a>
                </div>
            </div>
        </div>
    );
}
