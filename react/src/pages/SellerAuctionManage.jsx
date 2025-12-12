import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AuctionCountdown from '../components/AuctionCountdown';
import BidHistory from '../components/BidHistory';
import { useAuction, useWebSocket } from '../hooks/useAuction';

// Scheduled auction countdown component - uses local countdown like active auctions
function ScheduledAuctionCountdown({ seconds }) {
  const [displaySeconds, setDisplaySeconds] = useState(seconds);

  useEffect(() => {
    setDisplaySeconds(seconds);
  }, [seconds]);

  // Local countdown tick every second
  useEffect(() => {
    if (displaySeconds <= 0) return;

    const interval = setInterval(() => {
      setDisplaySeconds((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [displaySeconds]);

  const formatCountdown = (secs) => {
    if (!secs || secs <= 0) return 'Starting...';

    if (secs < 60) {
      return `${secs}s`;
    }

    const minutes = Math.floor(secs / 60);
    const remainingSecs = secs % 60;

    if (minutes < 60) {
      return `${minutes}m ${remainingSecs}s`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-primary-green rounded-lg p-8 shadow-md border-2 border-green-700 text-center">
      <div className="text-sm font-bold opacity-95 mb-3 uppercase tracking-wider text-green-50">Auction Starts In</div>
      <div className="text-5xl font-bold tracking-tight mb-3 text-white">
        {formatCountdown(displaySeconds)}
      </div>
      <p className="text-green-50 text-sm">Get ready! Your auction will start soon.</p>
    </div>
  );
}

export default function SellerAuctionManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Get user from localStorage
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });
  const userId = user?.user_id || null;

  const { auction, bidHistory, loading, error, refetch, refetchBids } = useAuction(id);
  const {
    isConnected,
    countdownSeconds,
    bidPlaced,
  } = useWebSocket(id, userId);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Determine auction state
  const isAuctionActive = auction?.status === 'ACTIVE';
  const isAuctionScheduled = auction?.status === 'SCHEDULED';
  const hasBids = auction?.highest_bidder_id !== null;

  // When a bid is placed via WebSocket, immediately refresh
  useEffect(() => {
    if (bidPlaced) {
      refetch();
      refetchBids();
    }
  }, [bidPlaced, refetch, refetchBids]);

  // Handle auction expiration
  const handleAuctionExpired = useCallback(async () => {
    try {
      const response = await axios.put(`/api/node/auctions/${id}/end`, {}, { withCredentials: true });
      console.log('[Auction] Auction ended:', response.data);
      if (response.data.order_id) {
        console.log('[Auction] Order created:', response.data.order_id);
      } else if (response.data.order_error) {
        console.warn('[Auction] Order creation failed:', response.data.order_error);
      }
      refetch();
    } catch (err) {
      console.log('[Auction] End auction response:', err.response?.data?.error || err.message);
      refetch();
    }
  }, [id, refetch]);

  // Accept current highest bid (end active auction with current bidder as winner)
  const handleAcceptBid = async () => {
    if (!window.confirm('Are you sure you want to stop this auction? The current highest bidder will win.')) {
      return;
    }
    
    setActionLoading(true);
    setActionError('');
    
    try {
      await axios.put(`/api/node/auctions/${id}/stop`, {}, { withCredentials: true });
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to stop auction');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel auction (only for scheduled)
  const handleCancelAuction = async () => {
    if (!window.confirm('Are you sure you want to cancel this auction? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(true);
    setActionError('');
    
    try {
      await axios.put(`/api/node/auctions/${id}/cancel`, {}, { withCredentials: true });
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to cancel auction');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px] text-text-dark">Loading auction...</div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <p className="text-error-red text-lg mb-6">Error: {error}</p>
        <button onClick={() => navigate('/manage-auctions')} className="px-6 py-3 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors">
          Back to My Auctions
        </button>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <p className="text-text-dark text-lg mb-6">Auction not found</p>
        <button onClick={() => navigate('/manage-auctions')} className="px-6 py-3 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors">
          Back to My Auctions
        </button>
      </div>
    );
  }

  // Check if user is the seller
  const isOwner = userId && userId === auction.seller_id;
  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <p className="text-error-red text-lg mb-6">You don't have permission to manage this auction</p>
        <button onClick={() => navigate('/manage-auctions')} className="px-6 py-3 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors">
          Back to Auctions
        </button>
      </div>
    );
  }

  // Format product image path
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/public')) return imagePath;
    if (imagePath.startsWith('public')) return `/${imagePath}`;
    return imagePath;
  };

  const productImageUrl = getImageUrl(auction.product_image);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <button onClick={() => navigate('/manage-auctions')} className="mb-6 px-4 py-2 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors">
        ← Back to My Auctions
      </button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-text-dark">Manage Auction</h1>
        <span className={`px-4 py-2 rounded-full font-medium text-sm ${
          auction.status === 'ACTIVE' ? 'bg-success-green text-white' : 
          auction.status === 'ENDED' ? 'bg-blue-500 text-white' : 
          'bg-error-red text-white'
        }`}>
          {auction.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Info & Countdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image/Info */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="aspect-video w-full bg-gray-100 flex items-center justify-center">
              {productImageUrl ? (
                <img src={productImageUrl} alt={auction.product_name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-lg">No Image</div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-3xl font-bold text-text-dark mb-4">{auction.product_name}</h2>
              <p className="text-text-muted mb-6 leading-relaxed">{auction.product_description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="block text-text-dark mb-1">Current Bid:</strong>
                  <span className="text-2xl font-bold text-primary-green">
                    {bidHistory.length > 0 ? `Rp ${parseFloat(auction.current_bid).toLocaleString('id-ID')}` : '-'}
                  </span>
                </div>
                {auction.highest_bidder_username && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <strong className="block text-text-dark mb-1">Highest Bidder:</strong>
                    <span className="text-lg font-medium text-text-dark">{auction.highest_bidder_username}</span>
                  </div>
                )}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="block text-text-dark mb-1">Total Bids:</strong>
                  <span className="text-lg font-medium text-text-dark">{bidHistory.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Countdown - Active Auction */}
          {isAuctionActive && (
            <AuctionCountdown
              countdownSeconds={countdownSeconds !== null ? countdownSeconds : auction?.seconds_remaining}
              onExpired={handleAuctionExpired}
            />
          )}

          {/* Scheduled Start Countdown */}
          {isAuctionScheduled && (
            <ScheduledAuctionCountdown seconds={auction.seconds_until_start} />
          )}

          {/* Status Badge - Ended/Cancelled */}
          {!isAuctionActive && !isAuctionScheduled && (
            <div className={`bg-white rounded-xl shadow-md p-6 text-center ${
              auction.status === 'ENDED' ? 'border-l-4 border-primary-green' : 'border-l-4 border-error-red'
            }`}>
              {auction.status === 'ENDED' && (
                <>
                  <strong className="block text-2xl text-text-dark mb-4">Auction Ended</strong>
                  {auction.winner_id ? (
                    <div className="space-y-2">
                      <div className="text-sm text-text-muted uppercase tracking-wide">Winner</div>
                      <div className="text-xl font-bold text-primary-green">{auction.winner_username}</div>
                      <div className="text-2xl font-bold text-text-dark mt-2">Rp {parseFloat(auction.current_bid).toLocaleString('id-ID')}</div>
                    </div>
                  ) : (
                    <p className="text-text-muted">No bids were placed on this auction</p>
                  )}
                </>
              )}
              {auction.status === 'CANCELLED' && (
                <strong className="block text-2xl text-error-red">Auction Cancelled</strong>
              )}
            </div>
          )}

          {/* Bid History */}
          <BidHistory bids={bidHistory} />
        </div>

        {/* Right Column: Seller Actions & Chat */}
        <div className="space-y-6">
          {/* Seller Actions - Scheduled Auction */}
          {isAuctionScheduled && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-text-dark mb-4">Seller Actions</h3>
              
              {actionError && (
                <div className="bg-error-red/10 border border-error-red text-error-red px-4 py-3 rounded-lg mb-4">{actionError}</div>
              )}
              
              <div className="space-y-3">
                <button 
                  onClick={handleCancelAuction}
                  className="w-full px-6 py-3 bg-error-red text-white rounded-lg hover:bg-red-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : '✕ Cancel Auction'}
                </button>
              </div>
              
              <p className="text-sm text-text-muted mt-4">
                You can cancel this scheduled auction anytime before it starts.
              </p>
            </div>
          )}

          {/* Seller Actions - Active Auction */}
          {isAuctionActive && hasBids && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-text-dark mb-4">Seller Actions</h3>
              
              {actionError && (
                <div className="bg-error-red/10 border border-error-red text-error-red px-4 py-3 rounded-lg mb-4">{actionError}</div>
              )}
              
              <div className="space-y-3">
                <button 
                  onClick={handleAcceptBid}
                  className="w-full px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : '⏹ Stop Auction & Accept Bid'}
                </button>
              </div>
              
              <p className="text-sm text-text-muted mt-4">
                Stop the auction to make the current highest bidder the winner and create an order immediately.
              </p>
            </div>
          )}

          {/* Seller Actions - Ended/Cancelled */}
          {!isAuctionActive && !isAuctionScheduled && (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <h3 className="text-xl font-bold text-text-dark mb-3">Auction {auction.status === 'ENDED' ? 'Completed' : 'Cancelled'}</h3>
              {auction.status === 'ENDED' && auction.winner_id ? (
                <p className="text-text-muted mb-4">The order has been created for the winner. Check your orders page for details.</p>
              ) : (
                <p className="text-text-muted mb-4">This auction has ended.</p>
              )}
              <a href="/seller/orders" className="inline-block w-full px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-all font-medium text-center">
                View Orders
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
