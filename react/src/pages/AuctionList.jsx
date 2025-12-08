import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuctionsList } from '../hooks/useAuction';
import AuctionCard from '../components/AuctionCard';


export default function AuctionList() {
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

  const [sortBy, setSortBy] = useState('countdown');

  const handleSort = (newSort) => {
    setSortBy(newSort);
  };

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
  };

  const sortedAuctions = [...auctions].sort((a, b) => {
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
    <div className="w-full">
      <div className="bg-white p-6 mb-6 rounded-lg shadow-sm border-b-4 border-primary-green">
        <div className="mb-4">
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none cursor-pointer hover:text-primary-green transition-colors"
          >
            <option value="ACTIVE">Active Auctions</option>
            <option value="ENDED">Ended Auctions</option>
          </select>
        </div>
        <p className="text-gray-600">
          {loading ? 'Loading...' : `${pagination.totalCount} auctions available`}
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <label htmlFor="sort" className="text-sm font-semibold text-gray-700">Sort by:</label>
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
          <label htmlFor="limit" className="text-sm font-semibold text-gray-700">Items per page:</label>
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

      {/* Auctions Grid */}
      {loading && !auctions.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-gray-600">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-green rounded-full animate-spin mb-6"></div>
          <p className="text-lg font-medium">Loading auctions...</p>
        </div>
      ) : sortedAuctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50 rounded-lg">
          <div className="text-6xl mb-6">🔨</div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">No Active Auctions</h3>
          <p className="text-gray-600 mb-8 max-w-md text-lg">There are no active auctions at the moment. Check back later or create one from the seller dashboard!</p>
          <div className="flex gap-4">
            <button onClick={refetch} className="bg-primary-green text-white font-bold px-8 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:-translate-y-1">
              Refresh
            </button>
            <a href="/home" className="bg-gray-300 text-gray-800 font-bold px-8 py-3 rounded-lg hover:bg-gray-400 transition-all duration-200">
              Back to Store
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedAuctions.map((auction) => (
              <Link key={auction.id} to={`/auction/${auction.id}`} className="h-full">
                <AuctionCard auction={auction} />
              </Link>
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
  );
}
