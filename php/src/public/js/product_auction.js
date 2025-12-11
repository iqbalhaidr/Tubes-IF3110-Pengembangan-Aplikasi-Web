// Check if product has an active or scheduled auction
async function checkProductAuction() {
    try {
        // Get product ID from the page
        const productId = document.querySelector('[data-product-id]')?.getAttribute('data-product-id');
        if (!productId) {
            console.error('Product ID not found on page');
            return;
        }

        // Fetch auction status
        const response = await fetch(`/api/node/auctions/products/${productId}/auction-status`);
        const data = await response.json();

        if (data.success && data.hasAuction && data.auction) {
            // Show auction section
            const auctionSection = document.getElementById('auctionSection');
            const goToAuctionBtn = document.getElementById('goToAuctionBtn');

            if (auctionSection && goToAuctionBtn) {
                auctionSection.style.display = 'block';
                // Link to auction detail page
                goToAuctionBtn.href = `/auction/${data.auction.id}`;
            }
        }
    } catch (error) {
        console.error('Error checking product auction:', error);
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkProductAuction);
} else {
    checkProductAuction();
}
