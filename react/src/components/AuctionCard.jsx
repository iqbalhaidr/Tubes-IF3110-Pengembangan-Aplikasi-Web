import { useState, useEffect } from 'react';

export default function AuctionCard({ auction, onAuctionStarted }) {
  const [displaySecondsRemaining, setDisplaySecondsRemaining] = useState(auction.seconds_remaining || 0);
  const [displaySecondsUntilStart, setDisplaySecondsUntilStart] = useState(auction.seconds_until_start || 0);

  // Update display seconds when auction prop changes
  useEffect(() => {
    setDisplaySecondsRemaining(auction.seconds_remaining || 0);
  }, [auction.seconds_remaining]);

  useEffect(() => {
    setDisplaySecondsUntilStart(auction.seconds_until_start || 0);
  }, [auction.seconds_until_start]);

  // Client-side countdown for active auctions ( just logical decrement every 1 second)
  useEffect(() => {
    if (displaySecondsRemaining <= 0 || auction.status !== 'ACTIVE') return;
    
    const interval = setInterval(() => {
      setDisplaySecondsRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [displaySecondsRemaining, auction.status]);

  // logical decrement every 1 second
  // Signal when auction is about to start (5 seconds before)
  useEffect(() => {
    if (displaySecondsUntilStart <= 0 || auction.status !== 'SCHEDULED') return;
    
    const interval = setInterval(() => {
      setDisplaySecondsUntilStart((prev) => {
        const newValue = prev - 1;
        
        // Signal when auction starts (countdown reaches 0)
        if (newValue <= 0 && onAuctionStarted) {
          onAuctionStarted(auction.id);
        }
        
        if (newValue < 0) return 0;
        return newValue;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [displaySecondsUntilStart, auction.status, auction.id, onAuctionStarted]);

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
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

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

  const statusColors = {
    active: 'bg-green-500',
    ended: 'bg-gray-500',
    cancelled: 'bg-red-500'
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer h-full shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-gray-300">
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={auction.product_name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">No Image</div>
        )}
        <span className={`absolute top-2 right-2 ${statusColors[getStatusColor(auction.status)] || 'bg-green-500'} text-white text-xs font-bold px-2 py-1 rounded`}>
          {auction.status}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">{auction.product_name}</h3>
        <p className="text-sm text-gray-600 mb-3 font-medium">by {auction.seller_username}</p>

        <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Current Bid</span>
            <span className="text-lg font-bold text-primary-green mt-1">Rp {parseFloat(auction.current_bid || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Bids</span>
            <span className="text-lg font-bold text-gray-900 mt-1">{auction.total_bids || 0}</span>
          </div>
        </div>

        <div className="mb-3">
          {auction.status === 'SCHEDULED' && displaySecondsUntilStart !== undefined ? (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Starts In</span>
              <span className="text-sm font-bold text-blue-600">
                {formatTime(displaySecondsUntilStart)}
              </span>
            </div>
          ) : auction.status === 'ACTIVE' && displaySecondsRemaining !== undefined ? (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Time Left</span>
              <span className={`text-sm font-bold ${displaySecondsRemaining < 3600 ? 'text-orange-600' : 'text-gray-700'}`}>
                {formatTime(displaySecondsRemaining)}
              </span>
            </div>
          ) : auction.status === 'CANCELLED' && auction.cancellation_reason ? (
            <div className="text-xs text-gray-600 italic border-l-2 border-red-500 pl-2">
              <span className="font-semibold">Cancellation Reason:</span> {auction.cancellation_reason}
            </div>
          ) : null}
        </div>

        <div className="mt-auto">
          {auction.highest_bidder_username ? (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Highest Bidder</span>
              <span className="text-sm font-semibold text-gray-900">{auction.highest_bidder_username}</span>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">No Bids Yet</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 pt-0">
        <button className="w-full bg-primary-green text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm active:scale-95">View Details</button>
      </div>
    </div>
  );
}
