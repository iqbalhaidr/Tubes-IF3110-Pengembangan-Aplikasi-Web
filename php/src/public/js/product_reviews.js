// Get product ID from URL
const productId = new URLSearchParams(window.location.search).get('id');
let currentPage = 1;
let currentSort = 'recent';
let currentRatingFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    if (productId) {
        loadProductReviews(1);
        initializeEventListeners();
    }
});

function initializeEventListeners() {
    // Add filter and sort listeners here if needed
}

function loadProductReviews(page = 1) {
    const container = document.getElementById('reviewsContainer');
    const paginationContainer = document.getElementById('reviewsPagination');
    
    container.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>Loading reviews...</p></div>';

    const params = new URLSearchParams({
        page: page,
        limit: 10,
        sort: currentSort,
        rating_filter: currentRatingFilter
    });

    api.get(`/api/node/reviews/product/${productId}?${params}`)
        .then(data => {
            if (data.success || data.reviews) {
                const reviews = data.reviews || data.data?.reviews || [];
                const pagination = data.data || data;
                
                if (reviews.length === 0) {
                    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #999;"><p>No reviews yet</p></div>';
                    paginationContainer.innerHTML = '';
                } else {
                    container.innerHTML = reviews.map(review => createReviewCard(review)).join('');
                    renderReviewsPagination(pagination.page, pagination.total_pages);
                }
            }
        })
        .catch(error => {
            console.error('Error loading reviews:', error);
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: red;"><p>Failed to load reviews</p></div>';
        });
}

function createReviewCard(review) {
    const createdDate = new Date(review.created_at).toLocaleDateString('id-ID');
    const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const verifiedBadge = review.is_verified_purchase ? '<span class="verified-badge">✓ Verified Purchase</span>' : '';
    
    // Handle images
    const imagesHtml = review.images && review.images.length > 0
        ? `<div class="review-images">
            ${review.images.map(img => `<img src="${img.image_path}" alt="Review image" class="review-image">`).join('')}
           </div>`
        : '';

    return `
        <div class="review-card">
            <div class="review-header">
                <div class="review-user-info">
                    <span class="review-user-name">${review.buyer_name || 'Anonymous'}</span>
                    ${verifiedBadge}
                </div>
                <span class="review-date">${createdDate}</span>
            </div>
            <div class="review-rating">
                <span class="stars">${stars}</span>
                <span class="rating-value">${review.rating}/5</span>
            </div>
            <div class="review-text">
                ${review.text}
            </div>
            ${imagesHtml}
            <div class="review-actions">
                <button class="btn-helpful" data-review-id="${review.review_id}" data-helpful="true">
                    👍 Helpful (${review.helpful_count || 0})
                </button>
                <button class="btn-not-helpful" data-review-id="${review.review_id}" data-helpful="false">
                    👎 Not Helpful (${review.not_helpful_count || 0})
                </button>
            </div>
        </div>
    `;
}

function renderReviewsPagination(currentPageNum, totalPages) {
    const container = document.getElementById('reviewsPagination');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="pagination">';
    
    if (currentPageNum > 1) {
        html += `<button class="pagination-btn" onclick="loadProductReviews(${currentPageNum - 1})">Previous</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPageNum) {
            html += `<span class="pagination-current">${i}</span>`;
        } else {
            html += `<button class="pagination-btn" onclick="loadProductReviews(${i})">${i}</button>`;
        }
    }

    if (currentPageNum < totalPages) {
        html += `<button class="pagination-btn" onclick="loadProductReviews(${currentPageNum + 1})">Next</button>`;
    }

    html += '</div>';
    container.innerHTML = html;

    // Add event listeners to helpfulness buttons
    document.querySelectorAll('.btn-helpful, .btn-not-helpful').forEach(btn => {
        btn.addEventListener('click', () => voteHelpfulness(btn.dataset.reviewId, btn.dataset.helpful === 'true'));
    });
}

function voteHelpfulness(reviewId, isHelpful) {
    api.post(`/api/node/reviews/${reviewId}/helpfulness`, { helpful: isHelpful })
        .then(data => {
            if (data.success) {
                // Reload reviews to show updated counts
                loadProductReviews(currentPage);
            }
        })
        .catch(error => {
            console.error('Error voting on helpfulness:', error);
            alert('Failed to vote. Please try again.');
        });
}
