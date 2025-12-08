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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-white p-6 rounded-lg shadow-sm border-b-4 border-primary-green">
        <div>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-3xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 cursor-pointer"
          >
            <option value="ACTIVE">Your Active Auctions</option>
            <option value="ENDED">Your Ended Auctions</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-gray-600 font-medium">
            {loading ? 'Loading...' : `${sellerAuctions.length} auctions`}
          </p>
          <button 
            onClick={() => navigate('/manage-auctions/create')} 
            className="px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-all font-bold active:scale-95"
          >
            + Create Auction
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5 mb-6 flex items-start justify-between shadow-sm">
          <div>
            <strong className="text-red-900 font-bold block mb-1">Error loading auctions</strong>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button onClick={refetch} className="px-6 py-2 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-8 border border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="sort" className="text-sm font-semibold text-gray-700">Sort by:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-30 outline-none text-sm font-medium transition-all duration-200"
          >
            <option value="countdown">Ending Soon</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="bids">Most Bids</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="limit" className="text-sm font-semibold text-gray-700">Items per page:</label>
          <select
            id="limit"
            value={pagination.limit}
            onChange={(e) => changeLimit(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-30 outline-none text-sm font-medium transition-all duration-200"
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
        <div className="flex flex-col items-center justify-center py-24 text-center text-gray-600">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-green rounded-full animate-spin mb-6"></div>
          <p className="text-lg font-medium">Loading your auctions...</p>
        </div>
      ) : sortedAuctions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <h3 className="text-3xl font-bold text-gray-900 mb-3">No Auctions Yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">You haven't created any auctions yet. Create your first auction to start selling!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/manage-auctions/create')} className="px-8 py-3 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-all font-bold">
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
