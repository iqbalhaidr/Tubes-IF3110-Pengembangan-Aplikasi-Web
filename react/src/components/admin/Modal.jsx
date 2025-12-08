/**
 * Modal Component - Reusable Modal Dialog
 * 
 * A customizable modal dialog with overlay, header, body, and footer.
 * Supports keyboard navigation (ESC to close) and click-outside-to-close.
 * 
 * @module components/common/Modal
 */

import { useEffect, useRef } from 'react';
import './Modal.css';

/**
 * Modal dialog component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Callback when modal should close
 * @param {string} props.title - Modal header title
 * @param {React.ReactNode} props.children - Modal body content
 * @param {React.ReactNode} props.footer - Optional footer content (buttons)
 * @param {string} props.size - Size variant: 'small', 'medium', 'large'
 * @param {boolean} props.showCloseButton - Show X button in header (default: true)
 * @param {boolean} props.closeOnOverlayClick - Close when clicking overlay (default: true)
 */
export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'medium',
    showCloseButton = true,
    closeOnOverlayClick = true
}) {
    const modalRef = useRef(null);

    // Handle ESC key press to close modal
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Focus trap - focus first focusable element
    useEffect(() => {
        if (isOpen && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }, [isOpen]);

    // Handle overlay click
    const handleOverlayClick = (event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
            onClose();
        }
    };

    // Don't render if not open
    if (!isOpen) return null;

    return (
        <div
            className="react-modal-overlay"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={`react-modal-content modal-${size}`}
                ref={modalRef}
            >
                {/* Modal Header */}
                <div className="modal-header">
                    <h2 id="modal-title" className="modal-title">{title}</h2>
                    {showCloseButton && (
                        <button
                            className="react-modal-close-btn"
                            onClick={onClose}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                    {children}
                </div>

                {/* Modal Footer (optional) */}
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
