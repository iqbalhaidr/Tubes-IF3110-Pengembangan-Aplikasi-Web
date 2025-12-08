/**
 * Toast Context - Global Toast Notification System
 * 
 * Provides a context for showing toast notifications across the app.
 * Usage:
 *   const { showToast } = useToast();
 *   showToast('Success message', 'success');
 * 
 * @module contexts/ToastContext
 */

import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/admin/Toast';

// Create the Toast context
const ToastContext = createContext(null);

/**
 * Toast Provider Component
 * Wrap your app with this to enable toast notifications
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function ToastProvider({ children }) {
    // State to hold all active toasts
    const [toasts, setToasts] = useState([]);

    /**
     * Show a new toast notification
     * 
     * @param {string} message - Toast message to display
     * @param {string} type - Type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Auto-dismiss duration in ms (default: 4000)
     */
    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random(); // Unique ID for this toast

        // Add new toast to the list
        setToasts(prev => [...prev, { id, message, type, duration }]);

        // Auto-remove toast after duration
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    /**
     * Remove a specific toast by ID
     * 
     * @param {number} id - Toast ID to remove
     */
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}
            {/* Toast Container - renders all active toasts */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/**
 * Custom hook to use toast notifications
 * 
 * @returns {{ showToast: Function, removeToast: Function }}
 */
export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
}

export default ToastContext;
