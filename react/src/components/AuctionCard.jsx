import '../styles/AuctionCard.css';

export default function AuctionCard({ auction }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'active';
      case 'ENDED':
        return 'ended';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'active';
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return 'Ended';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  // Format product image path - PHP stores as /public/images/products/X.jpg
  // These are served by PHP backend, so we need the correct URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // If path already starts with http, return as-is
    if (imagePath.startsWith('http')) return imagePath;
    // If path starts with /public, it's served by PHP
    if (imagePath.startsWith('/public')) return imagePath;
    // If path starts with public (no leading slash), add it
    if (imagePath.startsWith('public')) return `/${imagePath}`;
    // Otherwise return as-is
    return imagePath;
  };

  const imageUrl = getImageUrl(auction.product_image);

  return (
    <div className={`auction-card status-${getStatusColor(auction.status)}`}>
      <div className="card-image">
        {imageUrl ? (
          <img src={imageUrl} alt={auction.product_name} />
        ) : (
          <div className="placeholder">No Image</div>
        )}
        <span className={`status-badge ${getStatusColor(auction.status)}`}>
          {auction.status}
        </span>
      </div>

      <div className="card-content">
        <h3 className="product-name">{auction.product_name}</h3>
        <p className="seller-name">by {auction.seller_username}</p>

        <div className="bid-info">
          <div className="current-bid">
            <span className="label">Current Bid</span>
            <span className="value">Rp {parseFloat(auction.current_bid || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="total-bids">
            <span className="label">Bids</span>
            <span className="value">{auction.total_bids || 0}</span>
          </div>
        </div>

        <div className="countdown">
          {auction.seconds_remaining !== undefined && (
            <>
              <span className="label">Time Left</span>
              <span className="value">
                {formatTime(auction.seconds_remaining)}
              </span>
            </>
          )}
        </div>

        <div className="highest-bidder">
          {auction.highest_bidder_username ? (
            <>
              <span className="label">Highest Bid By</span>
              <span className="value">{auction.highest_bidder_username}</span>
            </>
          ) : (
            <>
              <span className="label">No Bids Yet</span>
              <span className="value">Be the first!</span>
            </>
          )}
        </div>
      </div>

      <div className="card-footer">
        <button className="btn btn-primary btn-sm">View Details</button>
      </div>
    </div>
  );
}
