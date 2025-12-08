/**
 * Toast Component - Individual Toast Notification
 * 
 * Displays a toast message with type-based styling and close button.
 * Usually managed by ToastContext, not used directly.
 * 
 * @module components/common/Toast
 */

import './Toast.css';

/**
 * Toast notification component
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Message to display
 * @param {string} props.type - Type: 'success', 'error', 'warning', 'info'
 * @param {Function} props.onClose - Callback when toast is closed
 */
export default function Toast({ message, type = 'info', onClose }) {
    // Icon based on toast type
    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    return (
        <div className={`toast toast-${type}`} role="alert" aria-live="polite">
            <span className="toast-icon">{getIcon()}</span>
            <span className="toast-message">{message}</span>
            <button
                className="toast-close"
                onClick={onClose}
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    );
}
