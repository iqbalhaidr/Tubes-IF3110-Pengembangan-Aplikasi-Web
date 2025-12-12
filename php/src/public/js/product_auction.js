/**
 * Check if product has an active or scheduled auction
 * Called on page load to determine if auction button should be shown
 * The auction button links to the React auction detail page: /auction/{auctionId}
 */
async function checkProductAuction() {
    try {
        // Get product ID from multiple sources (in order of preference):
        // 1. window.productId (set by PHP if available)
        // 2. URL path (if route is /product/{id})
        // 3. Add to Cart button data attribute (fallback)
        
        let productId = window.productId;
        
        if (!productId) {
            // Try to extract from URL path: /product/{id}
            const pathMatch = window.location.pathname.match(/\/product\/(\d+)/);
            if (pathMatch && pathMatch[1]) {
                productId = pathMatch[1];
            }
        }
        
        if (!productId) {
            // Fallback: get from Add to Cart button data attribute
            const addToCartBtn = document.getElementById('addToCartBtn');
            if (addToCartBtn) {
                productId = addToCartBtn.getAttribute('data-product-id');
            }
        }
        
        if (!productId) {
            console.warn('[Auction] Product ID not found (window.productId, URL path, or button data attribute)');
            return;
        }

        console.log(`[Auction] Checking for auctions on product #${productId}`);

        // Call Node.js API to check if product has a SCHEDULED or ACTIVE auction
        const response = await fetch(`/api/node/auctions/products/${productId}/auction-status`);
        
        if (!response.ok) {
            console.error(`[Auction] API error: ${response.status}`);
            return;
        }

        const data = await response.json();

        // Only show auction section if auction exists with SCHEDULED or ACTIVE status
        if (data.success && data.hasAuction && data.auction) {
            console.log(`[Auction] Found auction #${data.auction.id} with status: ${data.auction.status}`);
            
            const auctionSection = document.getElementById('auctionSection');
            const goToAuctionBtn = document.getElementById('goToAuctionBtn');

            if (auctionSection && goToAuctionBtn) {
                // Show the auction section
                auctionSection.style.display = 'block';
                
                // Set button href to React auction detail page
                goToAuctionBtn.href = `/auction/${data.auction.id}`;
                
                console.log(`[Auction] Auction button displayed, linking to /auction/${data.auction.id}`);
            } else {
                console.warn('[Auction] Auction section or button not found in DOM');
            }
        } else {
            console.log('[Auction] No active or scheduled auction found for this product');
        }
    } catch (error) {
        console.error('[Auction] Error checking product auction:', error);
        // Silently fail - auction feature is optional
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkProductAuction);
} else {
    checkProductAuction();
}
