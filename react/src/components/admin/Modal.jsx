/**
 * Modal Component - Reusable Modal Dialog
 * 
 * A customizable modal dialog with overlay, header, body, and footer.
 * Supports keyboard navigation (ESC to close) and click-outside-to-close.
 * Uses Tailwind CSS for styling.
 * 
 * @module components/common/Modal
 */

import { useEffect, useRef } from 'react';

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

    // Size classes mapping
    const sizeClasses = {
        small: 'max-w-[360px]',
        medium: 'max-w-[520px]',
        large: 'max-w-[720px]',
    };

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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] animate-modal-fade p-5 max-sm:p-0 max-sm:items-end"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={`bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col max-h-[90vh] animate-modal-slide overflow-hidden w-full ${sizeClasses[size] || sizeClasses.medium} max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-h-[80vh] max-sm:max-w-full`}
                ref={modalRef}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between py-4 px-5 border-b border-border-color shrink-0">
                    <h2 id="modal-title" className="text-lg font-semibold text-text-dark m-0">
                        {title}
                    </h2>
                    {showCloseButton && (
                        <button
                            className="bg-transparent border-none text-[28px] text-text-light cursor-pointer w-8 h-8 flex items-center justify-center rounded-md transition-all leading-none hover:bg-background-gray hover:text-text-dark"
                            onClick={onClose}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto flex-1">
                    {children}
                </div>

                {/* Modal Footer (optional) */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 py-4 px-5 border-t border-border-color shrink-0 max-sm:flex-col-reverse max-sm:gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
