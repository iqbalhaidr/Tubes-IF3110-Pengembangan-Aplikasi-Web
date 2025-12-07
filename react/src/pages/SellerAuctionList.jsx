import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuctionsList } from '../hooks/useAuction';
import AuctionCard from '../components/AuctionCard';

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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-3xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-text-dark cursor-pointer"
          >
            <option value="ACTIVE">My Active Auctions</option>
            <option value="ENDED">My Ended Auctions</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-text-muted">
            {loading ? 'Loading...' : `${sellerAuctions.length} auctions`}
          </p>
          <button 
            onClick={() => navigate('/manage-auctions/create')} 
            className="px-6 py-3 bg-gradient-to-r from-primary-green to-primary-green-light text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            + Create Auction
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error-red/10 border border-error-red rounded-lg p-4 mb-6 flex items-start justify-between">
          <div>
            <strong className="text-error-red font-bold block mb-1">Error loading auctions</strong>
            <p className="text-error-red">{error}</p>
          </div>
          <button onClick={refetch} className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green/90 transition-colors text-sm font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm font-medium text-text-dark">Sort by:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all text-sm"
          >
            <option value="countdown">Ending Soon</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="bids">Most Bids</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="limit" className="text-sm font-medium text-text-dark">Items per page:</label>
          <select
            id="limit"
            value={pagination.limit}
            onChange={(e) => changeLimit(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all text-sm"
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
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-green border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-text-muted">Loading your auctions...</p>
        </div>
      ) : sortedAuctions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🔨</div>
          <h3 className="text-2xl font-bold text-text-dark mb-3">No Auctions Yet</h3>
          <p className="text-text-muted mb-6 max-w-md mx-auto">You haven't created any auctions yet. Create your first auction to start selling!</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/manage-auctions/create')} className="px-6 py-3 bg-gradient-to-r from-primary-green to-primary-green-light text-white rounded-lg hover:shadow-lg transition-all font-medium">
              Create Auction
            </button>
            <a href="/seller/products" className="px-6 py-3 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors font-medium inline-block">
              Manage Products
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedAuctions.map((auction) => (
              <Link key={auction.id} to={`/manage-auctions/${auction.id}`}>
                <AuctionCard auction={auction} showSellerBadge={false} />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-white border border-gray-300 text-text-dark rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                ← Previous
              </button>

              <span className="text-sm text-text-muted font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-white border border-gray-300 text-text-dark rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
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
