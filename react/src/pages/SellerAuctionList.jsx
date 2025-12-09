import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
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

  const [deleteLoading, setDeleteLoading] = useState({});
  const [deleteError, setDeleteError] = useState({});

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

  const handleDeleteAuction = async (auctionId) => {
    if (!window.confirm('Are you sure you want to delete this auction?')) {
      return;
    }

    setDeleteLoading(prev => ({ ...prev, [auctionId]: true }));
    setDeleteError(prev => ({ ...prev, [auctionId]: '' }));

    try {
      await axios.delete(
        `/api/node/auctions/${auctionId}`,
        { withCredentials: true }
      );
      
      // Refetch auctions after deletion
      refetch();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete auction';
      setDeleteError(prev => ({ ...prev, [auctionId]: errorMsg }));
    } finally {
      setDeleteLoading(prev => ({ ...prev, [auctionId]: false }));
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Manage Auctions</h1>
          <div className="flex gap-2 border-b-2 border-gray-200">
            {['SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-3 font-semibold transition-all border-b-2 -mb-0.5 ${
                  statusFilter === status
                    ? 'border-primary-green text-primary-green'
                    : 'border-transparent text-gray-600 hover:text-primary-green'
                }`}
              >
                {status === 'SCHEDULED' ? 'Scheduled' : status === 'ACTIVE' ? 'Active' : status === 'ENDED' ? 'Ended' : 'Cancelled'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-end">
          <p className="text-gray-600 font-medium">
            {loading ? 'Loading...' : `${sellerAuctions.length} auctions`}
          </p>
          <button 
            onClick={() => navigate('/manage-auctions/create')} 
            className="px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-colors font-bold shadow-md"
          >
            + Create Auction
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6 flex items-start justify-between">
          <div>
            <strong className="text-red-700 font-bold block mb-1">Error loading auctions</strong>
            <p className="text-red-600">{error}</p>
          </div>
          <button onClick={refetch} className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6 flex flex-col sm:flex-row gap-4 justify-between border-t-4 border-primary-green">
        <div className="flex items-center gap-3">
          <label htmlFor="sort" className="text-sm font-bold text-gray-700 uppercase">Sort by:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all text-sm font-medium text-gray-700 bg-white cursor-pointer"
          >
            <option value="countdown">Ending Soon</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="bids">Most Bids</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="limit" className="text-sm font-bold text-gray-700 uppercase">Per page:</label>
          <select
            id="limit"
            value={pagination.limit}
            onChange={(e) => changeLimit(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all text-sm font-medium text-gray-700 bg-white cursor-pointer"
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
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-primary-green border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your auctions...</p>
        </div>
      ) : sortedAuctions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-16 text-center border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Auctions Yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">You haven't created any auctions yet. Create your first auction to start selling!</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/manage-auctions/create')} className="px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-colors font-bold">
              Create Auction
            </button>
            <a href="/seller/products" className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-bold inline-block">
              Manage Products
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedAuctions.map((auction) => (
              <div key={auction.id} className="relative group">
                <Link to={`/manage-auctions/${auction.id}`}>
                  <AuctionCard auction={auction} showSellerBadge={false} />
                </Link>
                
                {/* Delete Button for SCHEDULED auctions with no bids */}
                {auction.status === 'SCHEDULED' && auction.total_bids === 0 && (
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteAuction(auction.id);
                      }}
                      disabled={deleteLoading[auction.id]}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all shadow-md"
                    >
                      {deleteLoading[auction.id] ? '🗑️ Deleting...' : '🗑️ Delete'}
                    </button>
                    {deleteError[auction.id] && (
                      <div className="absolute top-full right-0 mt-2 bg-white border border-red-500 text-red-700 text-xs p-3 rounded shadow-lg z-10 max-w-xs font-medium">
                        {deleteError[auction.id]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-800 rounded-lg hover:border-primary-green hover:text-primary-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                ← Previous
              </button>

              <span className="text-gray-700 font-bold px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-800 rounded-lg hover:border-primary-green hover:text-primary-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
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
