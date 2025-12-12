/**
 * Get product ID from multiple sources (in order of preference):
 * 1. window.productId (set by PHP if available)
 * 2. URL path (if route is /product/{id})
 * 3. URL query param (if route is /product?id={id})
 * 4. Data attribute on page (if set by PHP)
 */
function getProductId() {
    // Try window variable first (most reliable if PHP sets it)
    if (window.productId) {
        return window.productId;
    }
    
    // Try URL path: /product/{id}
    const pathMatch = window.location.pathname.match(/\/product\/(\d+)/);
    if (pathMatch && pathMatch[1]) {
        return pathMatch[1];
    }
    
    // Try URL query param: ?id={id}
    const queryId = new URLSearchParams(window.location.search).get('id');
    if (queryId) {
        return queryId;
    }
    
    // Try data attribute on body or main container
    const bodyId = document.body.getAttribute('data-product-id');
    if (bodyId) {
        return bodyId;
    }
    
    const mainContainer = document.querySelector('[data-product-id]');
    if (mainContainer) {
        return mainContainer.getAttribute('data-product-id');
    }
    
    return null;
}

const productId = getProductId();
let currentPage = 1;
let currentSort = 'recent';
let currentRatingFilter = 'all';
let ratingStats = null;

document.addEventListener('DOMContentLoaded', function() {
    if (productId) {
        console.log(`[Reviews] Loaded reviews for product #${productId}`);
        loadProductReviews(1);
        loadRatingStats();
        initializeEventListeners();
    } else {
        console.warn('[Reviews] Product ID not found');
        const container = document.getElementById('reviewsContainer');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: red;"><p>Unable to load reviews - Product ID not found</p></div>';
        }
    }
});

function initializeEventListeners() {
    // Add filter and sort listeners here if needed
}

function loadRatingStats() {
    // Fetch rating statistics for this product
    api.get(`/api/node/reviews/product/${productId}/stats`)
        .then(data => {
            if (data.success || data.average_rating !== undefined) {
                ratingStats = data;
                displayRatingStats(data);
            }
        })
        .catch(error => {
            console.error('[Reviews] Error loading rating stats:', error);
        });
}

function displayRatingStats(stats) {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;
    
    const statsDiv = document.createElement('div');
    statsDiv.className = 'rating-stats-header';
    
    if (stats.total_reviews === 0) {
        statsDiv.innerHTML = '<p style="color: #999;">Belum ada rating</p>';
    } else {
        const avgRating = parseFloat(stats.average_rating).toFixed(1);
        const stars = '⭐'.repeat(Math.round(stats.average_rating)) + '☆'.repeat(5 - Math.round(stats.average_rating));
        statsDiv.innerHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px;">
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">
                    ${stars} <span style="font-size: 16px;">${avgRating}/5</span>
                </div>
                <p style="color: #666; margin: 0;">Berdasarkan ${stats.total_reviews} rating</p>
            </div>
        `;
    }
    
    const existingStats = container.querySelector('.rating-stats-header');
    if (existingStats) {
        existingStats.replaceWith(statsDiv);
    } else {
        container.insertBefore(statsDiv, container.firstChild);
    }
}

function loadProductReviews(page = 1) {
    const container = document.getElementById('reviewsContainer');
    const paginationContainer = document.getElementById('reviewsPagination');
    
    if (!container) return;
    
    const existingStats = container.querySelector('.rating-stats-header');
    if (!existingStats) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>Loading reviews...</p></div>';
    }

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
                    if (!existingStats) {
                        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #999;"><p>No reviews yet</p></div>';
                    }
                    paginationContainer.innerHTML = '';
                } else {
                    let reviewsHtml = '';
                    if (existingStats) {
                        reviewsHtml = existingStats.outerHTML;
                    }
                    reviewsHtml += reviews.map(review => createReviewCard(review)).join('');
                    container.innerHTML = reviewsHtml;
                    renderReviewsPagination(pagination.page, pagination.total_pages);
                }
            }
        })
        .catch(error => {
            console.error('[Reviews] Error loading reviews:', error);
            if (!existingStats) {
                container.innerHTML = '<div style="text-align: center; padding: 2rem; color: red;"><p>Failed to load reviews</p></div>';
            }
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
            console.error('[Reviews] Error voting on helpfulness:', error);
            alert('Failed to vote. Please try again.');
        });
}
