import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuctionsList } from '../hooks/useAuction';
import AuctionCard from '../components/AuctionCard';
import '../styles/AuctionList.css';


export default function AuctionList() {
  const {
    auctions,
    pagination,
    loading,
    error,
    goToPage,
    changeLimit,
    refetch,
  } = useAuctionsList();

  const [sortBy, setSortBy] = useState('countdown');

  const handleSort = (newSort) => {
    setSortBy(newSort);
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
    <div className="auction-list-page">
      <div className="page-header">
        <h1>Active Auctions</h1>
        <p className="subtitle">
          {pagination.totalCount} auctions available
        </p>
      </div>

      {error && (
        <div className="error-alert">
          <strong>Error:</strong> {error}
          <button onClick={refetch} className="btn btn-sm">
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
          <p>Loading auctions...</p>
        </div>
      ) : sortedAuctions.length === 0 ? (
        <div className="empty-state">
          <p>No auctions available at the moment.</p>
          <button onClick={refetch} className="btn btn-primary">
            Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="auctions-grid">
            {sortedAuctions.map((auction) => (
              <Link key={auction.id} to={`/auction/${auction.id}`}>
                <AuctionCard auction={auction} />
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
