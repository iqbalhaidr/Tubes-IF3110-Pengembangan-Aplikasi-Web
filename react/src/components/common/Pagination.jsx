/**
 * Pagination Component - Reusable Pagination Control
 * 
 * Provides navigation between pages with customizable display.
 * 
 * @module components/common/Pagination
 */

import './Pagination.css';

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

    return (
        <nav className={`pagination pagination-${size}`} aria-label="Pagination">
            {/* Previous Button */}
            <button
                className="pagination-btn pagination-prev"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={isFirstPage}
                aria-label="Previous page"
            >
                ‹
            </button>

            {/* Page Numbers */}
            <div className="pagination-pages">
                {pageNumbers.map((page, index) => (
                    page === '...' ? (
                        <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            className={`pagination-btn pagination-page ${page === currentPage ? 'active' : ''}`}
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
                className="pagination-btn pagination-next"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={isLastPage}
                aria-label="Next page"
            >
                ›
            </button>
        </nav>
    );
}
