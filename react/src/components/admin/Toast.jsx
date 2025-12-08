/**
 * Toast Component - Individual Toast Notification
 * 
 * Displays a toast message with type-based styling and close button.
 * Usually managed by ToastContext, not used directly.
 * 
 * Uses Tailwind CSS for styling.
 * 
 * @module components/common/Toast
 */

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

    // Type-specific styles for border and icon background
    const typeStyles = {
        success: {
            border: 'border-l-success-green',
            iconBg: 'bg-success-green',
        },
        error: {
            border: 'border-l-error-red',
            iconBg: 'bg-error-red',
        },
        warning: {
            border: 'border-l-warning-orange',
            iconBg: 'bg-warning-orange',
        },
        info: {
            border: 'border-l-info-blue',
            iconBg: 'bg-info-blue',
        },
    };

    const styles = typeStyles[type] || typeStyles.info;

    return (
        <div
            className={`flex items-center gap-3 py-3.5 px-4 rounded-lg bg-white shadow-lg animate-toast-slide pointer-events-auto min-w-[280px] border-l-4 ${styles.border}`}
            role="alert"
            aria-live="polite"
        >
            <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0 text-white ${styles.iconBg}`}
            >
                {getIcon()}
            </span>
            <span className="flex-1 text-sm text-text-dark leading-snug">
                {message}
            </span>
            <button
                className="bg-transparent border-none text-xl text-text-light cursor-pointer p-0 w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-background-gray hover:text-text-dark"
                onClick={onClose}
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    );
}
