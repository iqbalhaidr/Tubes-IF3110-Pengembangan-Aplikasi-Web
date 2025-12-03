import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuctionsList } from '../hooks/useAuction';
import AuctionCard from '../components/AuctionCard';
import '../styles/AuctionList.css';
import '../styles/SellerAuction.css';

export default function SellerAuctionList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const {
    auctions,
    pagination,
    loading,
    error,
    goToPage,
    changeLimit,
    refetch,
  } = useAuctionsList(statusFilter);

  // Check if user is seller
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  // Get seller's auctions only
  const [sellerAuctions, setSellerAuctions] = useState([]);
  
  useEffect(() => {
    if (user?.user_id && auctions.length > 0) {
      const filtered = auctions.filter(a => a.seller_id === user.user_id);
      setSellerAuctions(filtered);
    } else {
      setSellerAuctions(auctions);
    }
  }, [auctions, user?.user_id]);

  const [sortBy, setSortBy] = useState('countdown');

  const handleSort = (newSort) => {
    setSortBy(newSort);
  };

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
  };

  const sortedAuctions = [...sellerAuctions].sort((a, b) => {
    switch (sortBy) {
      case 'countdown':
        return (a.seconds_remaining || 0) - (b.seconds_remaining || 0);
      case 'price-low':
        return a.current_bid - b.current_bid;
      case 'price-high':
        return b.current_bid - a.current_bid;
      case 'bids':
        return b.total_bids - a.total_bids;
      default:
        return 0;
    }
  });

  return (
    <div className="auction-list-page seller-auction-page">
      <div className="page-header">
        <div className="title-with-filter">
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="status-filter-select"
          >
            <option value="ACTIVE">My Active Auctions</option>
            <option value="ENDED">My Ended Auctions</option>
          </select>
        </div>
        <div className="page-header-actions">
          <p className="subtitle">
            {loading ? 'Loading...' : `${sellerAuctions.length} auctions`}
          </p>
          <button 
            onClick={() => navigate('/manage-auctions/create')} 
            className="btn btn-primary create-auction-btn"
          >
            + Create Auction
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <div>
            <strong>Error loading auctions</strong>
            <p>{error}</p>
          </div>
          <button onClick={refetch} className="btn btn-primary btn-sm">
            Retry
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="auction-controls">
        <div className="sort-controls">
          <label htmlFor="sort">Sort by:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
          >
            <option value="countdown">Ending Soon</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="bids">Most Bids</option>
          </select>
        </div>

        <div className="pagination-controls">
          <label htmlFor="limit">Items per page:</label>
          <select
            id="limit"
            value={pagination.limit}
            onChange={(e) => changeLimit(parseInt(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Auctions Grid */}
      {loading && !auctions.length ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your auctions...</p>
        </div>
      ) : sortedAuctions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔨</div>
          <h3>No Auctions Yet</h3>
          <p>You haven't created any auctions yet. Create your first auction to start selling!</p>
          <div className="empty-actions">
            <button onClick={() => navigate('/manage-auctions/create')} className="btn btn-primary">
              Create Auction
            </button>
            <a href="/seller/products" className="btn btn-secondary">
              Manage Products
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="auctions-grid">
            {sortedAuctions.map((auction) => (
              <Link key={auction.id} to={`/manage-auctions/${auction.id}`}>
                <AuctionCard auction={auction} showSellerBadge={false} />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn btn-sm"
              >
                ← Previous
              </button>

              <span className="page-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-sm"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
