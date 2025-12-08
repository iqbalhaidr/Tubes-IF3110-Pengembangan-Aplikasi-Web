/**
 * Pagination Component - Reusable Pagination Control
 * 
 * Provides navigation between pages with customizable display.
 * Uses Tailwind CSS for styling.
 * 
 * @module components/common/Pagination
 */

/**
 * Pagination component
 * 
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current active page (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback when page changes: (newPage) => void
 * @param {number} props.siblingCount - Number of page numbers to show on each side (default: 1)
 * @param {string} props.size - Size variant: 'small', 'medium' (default: 'medium')
 */
export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
    size = 'medium'
}) {
    // Don't render if only 1 page or less
    if (totalPages <= 1) return null;

    // Size classes mapping
    const sizeClasses = {
        small: {
            btn: 'min-w-7 h-7 text-xs px-1.5',
            ellipsis: 'w-7 h-7',
        },
        medium: {
            btn: 'min-w-9 h-9 text-sm px-2',
            ellipsis: 'w-9 h-9',
        },
    };

    const sizes = sizeClasses[size] || sizeClasses.medium;

    /**
     * Generate array of page numbers to display
     * Shows: first page, last page, current page, and siblings
     */
    const getPageNumbers = () => {
        const pages = [];

        // Always show first page
        pages.push(1);

        // Calculate range around current page
        const rangeStart = Math.max(2, currentPage - siblingCount);
        const rangeEnd = Math.min(totalPages - 1, currentPage + siblingCount);

        // Add ellipsis if there's a gap after first page
        if (rangeStart > 2) {
            pages.push('...');
        }

        // Add pages in range
        for (let i = rangeStart; i <= rangeEnd; i++) {
            pages.push(i);
        }

        // Add ellipsis if there's a gap before last page
        if (rangeEnd < totalPages - 1) {
            pages.push('...');
        }

        // Always show last page (if more than 1 page)
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    // Base button classes
    const btnBase = `flex items-center justify-center border border-border-color bg-white text-text-dark cursor-pointer font-sans font-medium transition-all duration-200 rounded-md ${sizes.btn}`;
    const btnHover = 'hover:border-primary-green hover:text-primary-green hover:bg-primary-green/5';
    const btnActive = '!bg-primary-green !border-primary-green !text-white';
    const btnDisabled = 'opacity-50 cursor-not-allowed bg-background-gray';

    return (
        <nav
            className="flex items-center justify-center gap-1 py-4 max-sm:flex-wrap max-sm:gap-2"
            aria-label="Pagination"
        >
            {/* Previous Button */}
            <button
                className={`${btnBase} text-lg font-semibold ${isFirstPage ? btnDisabled : btnHover} max-sm:order-0`}
                onClick={() => onPageChange(currentPage - 1)}
                disabled={isFirstPage}
                aria-label="Previous page"
            >
                ‹
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 max-sm:order-1 max-sm:w-full max-sm:justify-center">
                {pageNumbers.map((page, index) => (
                    page === '...' ? (
                        <span
                            key={`ellipsis-${index}`}
                            className={`flex items-center justify-center text-text-light font-semibold ${sizes.ellipsis}`}
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            className={`${btnBase} ${page === currentPage ? btnActive : btnHover}`}
                            onClick={() => onPageChange(page)}
                            aria-current={page === currentPage ? 'page' : undefined}
                            aria-label={`Page ${page}`}
                        >
                            {page}
                        </button>
                    )
                ))}
            </div>

            {/* Next Button */}
            <button
                className={`${btnBase} text-lg font-semibold ${isLastPage ? btnDisabled : btnHover} max-sm:order-2`}
                onClick={() => onPageChange(currentPage + 1)}
                disabled={isLastPage}
                aria-label="Next page"
            >
                ›
            </button>
        </nav>
    );
}
