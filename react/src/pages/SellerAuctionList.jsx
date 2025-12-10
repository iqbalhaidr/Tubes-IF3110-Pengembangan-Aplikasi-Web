import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuctionsList } from '../hooks/useAuction';
import AuctionCard from '../components/AuctionCard';
import ProductPickerModal from '../components/ProductPickerModal';

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
  const [isPickerOpen, setIsPickerOpen] = useState(false);

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

  const handleProductSelected = (productId) => {
    setIsPickerOpen(false);
    navigate(`/seller/products/${productId}/create-auction`);
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
    <>
      <div className="w-full">
        <div className="bg-white p-6 mb-6 rounded-lg shadow-sm border-b-4 border-primary-green">
          {/* Header with Title and Tabs */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Manage Auctions</h1>
            <button onClick={() => setIsPickerOpen(true)} className="bg-primary-green text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 whitespace-nowrap">
              + Create New Auction
            </button>
          </div>

          {/* Tabs for Status Filter */}
          <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
            {['SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-6 py-3 font-semibold transition-all border-b-2 whitespace-nowrap ${
                  statusFilter === status
                    ? 'border-primary-green text-primary-green'
                    : 'border-transparent text-gray-600 hover:text-primary-green'
                }`}
              >
                {status === 'SCHEDULED' ? 'Scheduled' : status === 'ACTIVE' ? 'Active' : status === 'ENDED' ? 'Ended' : 'Cancelled'}
              </button>
            ))}
          </div>
          <p className="text-gray-600 mt-4">
            {loading ? 'Loading...' : `${sellerAuctions.length} auction${sellerAuctions.length !== 1 ? 's' : ''} in this status`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5 mb-6 flex justify-between items-center gap-4 shadow-sm">
            <div>
              <strong className="block mb-1 text-red-900">Error loading auctions</strong>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button onClick={refetch} className="bg-primary-green text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap">
              Retry
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-4 mb-8 bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          {/* Sort and Limit Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-sm font-semibold text-gray-700 whitespace-nowrap">Sort by:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-50 outline-none text-sm font-medium transition-all duration-200"
              >
                <option value="countdown">Ending Soon</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="bids">Most Bids</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="limit" className="text-sm font-semibold text-gray-700 whitespace-nowrap">Items per page:</label>
              <select
                id="limit"
                value={pagination.limit}
                onChange={(e) => changeLimit(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-50 outline-none text-sm font-medium transition-all duration-200"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Auctions Grid */}
        {loading && !auctions.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-gray-600">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-green rounded-full animate-spin mb-6"></div>
            <p className="text-lg font-medium">Loading your auctions...</p>
          </div>
        ) : sortedAuctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50 rounded-lg">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No Auctions Found</h3>
            <div className="flex gap-4">
              <a href="/seller/products" className="bg-gray-300 text-gray-800 font-bold px-8 py-3 rounded-lg hover:bg-gray-400 transition-all duration-200">
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
                  className="bg-primary-green text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-green transform hover:-translate-y-1"
                >
                  ← Previous
                </button>

                <span className="text-gray-700 font-semibold px-4">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="bg-primary-green text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-green transform hover:-translate-y-1"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <ProductPickerModal 
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onProductSelect={handleProductSelected}
      />
    </>
  );
}
