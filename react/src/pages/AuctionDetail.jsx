import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import BidForm from '../components/BidForm';
import AuctionCountdown from '../components/AuctionCountdown';
import BidHistory from '../components/BidHistory';
import { useAuction, useBid, useWebSocket } from '../hooks/useAuction';

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
      <p className="text-green-50 text-sm">Get ready! Bidding will start soon.</p>
    </div>
  );
}

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Get user from localStorage (set by App.jsx auth check)
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });
  const userId = user?.user_id || null;
  const isAuthenticated = !!userId;

  const { auction, bidHistory, loading, error, refetch, refetchBids } = useAuction(id);
  const { bidAmount, setBidAmount, isSubmitting, bidError, bidSuccess, placeBid, validateBid } = useBid(id);
  const {
    isConnected,
    countdownSeconds,
    bidPlaced,
    auctionEnded,
    auctionActivated,
    auctionCancelled,
  } = useWebSocket(id, userId);

  const isAuctionActive = auction?.status === 'ACTIVE';
  const isAuctionScheduled = auction?.status === 'SCHEDULED';
  const isUserSeller = userId && userId === auction?.seller_id;
  const canBid = isAuthenticated && !isUserSeller && isAuctionActive;

  // When a bid is placed via WebSocket, immediately refresh auction and bid history
  useEffect(() => {
    if (bidPlaced) {
      refetch();
      refetchBids();
    }
  }, [bidPlaced, refetch, refetchBids]);

  // Listen for auction ended event from WebSocket for instant re-render
  useEffect(() => {
    if (auctionEnded) {
      console.log('[AuctionDetail] Auction ended via WebSocket:', auctionEnded);
      refetch();
      refetchBids();
    }
  }, [auctionEnded, refetch, refetchBids]);

  // Listen for auction activation (SCHEDULED → ACTIVE) for instant re-render
  useEffect(() => {
    if (auctionActivated) {
      console.log('[AuctionDetail] Auction activated via WebSocket:', auctionActivated);
      refetch();
      refetchBids();
    }
  }, [auctionActivated, refetch, refetchBids]);

  // Listen for auction cancellation for instant re-render
  useEffect(() => {
    if (auctionCancelled) {
      console.log('[AuctionDetail] Auction cancelled via WebSocket:', auctionCancelled);
      refetch();
      refetchBids();
    }
  }, [auctionCancelled, refetch, refetchBids]);

  // Handle auction expiration - call the end auction API
  const handleAuctionExpired = useCallback(async () => {
    try {
      // Call the end auction API with credentials for proper session handling
      const response = await axios.put(`/api/node/auctions/${id}/end`, {}, { withCredentials: true });
      console.log('[Auction] Auction ended:', response.data);
      if (response.data.order_id) {
        console.log('[Auction] Order created:', response.data.order_id);
      } else if (response.data.order_error) {
        console.warn('[Auction] Order creation failed:', response.data.order_error);
      }
      // Refetch to get updated auction status
      refetch();
    } catch (err) {
      // If auction was already ended or other error, just refetch
      console.log('[Auction] End auction response:', err.response?.data?.error || err.message);
      refetch();
    }
  }, [id, refetch]);

  const handleBidSubmit = async (amount) => {
    const validationMsg = validateBid(
      amount,
      auction.current_bid,
      auction.min_bid_increment
    );

    if (validationMsg) {
      return;
    }

    try {
      const bidResult = await placeBid(amount);
      // Update user balance from bid response
      if (bidResult && bidResult.new_balance !== undefined) {
        const updatedUser = {
          ...user,
          balance: bidResult.new_balance
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      refetch();
    } catch (err) {
      console.error('Bid submission failed:', err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px] text-text-dark">Loading auction...</div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <p className="text-error-red text-lg mb-6">Error: {error}</p>
        <button onClick={() => navigate('/auctions')} className="px-6 py-3 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors">
          Back to Auctions
        </button>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <p className="text-text-dark text-lg mb-6">Auction not found</p>
        <button onClick={() => navigate('/auctions')} className="px-6 py-3 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors">
          Back to Auctions
        </button>
      </div>
    );
  }

  // Format product image path - PHP stores as /public/images/products/X.jpg
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
      <button onClick={() => navigate('/auctions')} className="mb-8 inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold">
        ← Back to Auctions
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Info & Countdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image/Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-video w-full bg-gray-100 flex items-center justify-center">
              {productImageUrl ? (
                <img src={productImageUrl} alt={auction.product_name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-lg font-medium">No Image</div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{auction.product_name}</h2>
              <p className="text-gray-700 mb-6 leading-relaxed text-base">
                {auction.product_description?.replace(/<[^>]*>/g, '') || 'No description available'}
              </p>
              <div className="space-y-3 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <strong className="text-gray-700 font-semibold">Seller:</strong>
                  <a href={`/store/${auction.store_id}`} className="text-primary-green font-medium hover:underline transition-colors cursor-pointer">{auction.seller_username}</a>
                </div>
                {auction.seller_address && (
                  <div className="flex items-center justify-between">
                    <strong className="text-gray-700 font-semibold">Location:</strong>
                    <span className="text-gray-900 font-medium">{auction.seller_address}</span>
                  </div>
                )}
                {auction.auction_quantity && (
                  <div className="flex items-center justify-between">
                    <strong className="text-gray-700 font-semibold">Quantity Available:</strong>
                    <span className="text-gray-900 font-medium">{auction.auction_quantity} units</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Countdown */}
          {isAuctionActive && (
            <AuctionCountdown
              countdownSeconds={countdownSeconds !== null ? countdownSeconds : auction?.seconds_remaining}
              onExpired={handleAuctionExpired}
              auctionId={id}
            />
          )}

          {/* Scheduled Start Countdown */}
          {isAuctionScheduled && (
            <ScheduledAuctionCountdown seconds={auction.seconds_until_start} />
          )}

          {/* Status Badge */}
          {!isAuctionActive && !isAuctionScheduled && (
            <div className={`bg-white rounded-lg shadow-sm p-8 text-center border-l-4 ${
              auction.status === 'ENDED' ? 'border-primary-green' : 'border-red-500'
            }`}>
              {auction.status === 'ENDED' && (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Auction Ended</h3>
                  {auction.winner_id ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 uppercase tracking-wider font-semibold">Winner</div>
                      <div className="text-2xl font-bold text-primary-green mb-3">{auction.winner_username}</div>
                      <div className="text-3xl font-bold text-gray-900">Rp {parseFloat(auction.current_bid).toLocaleString('id-ID')}</div>
                    </div>
                  ) : (
                    <p className="text-gray-700 text-lg">No bids were placed on this auction</p>
                  )}
                </>
              )}
              {auction.status === 'CANCELLED' && (
                <h3 className="text-2xl font-bold text-red-600">Auction Cancelled</h3>
              )}
            </div>
          )}

          {/* Bid History */}
          <BidHistory bids={bidHistory} currentUserId={userId} />
        </div>

        {/* Right Column: Bid Form & Seller Actions */}
        <div className="space-y-6">
          {/* Bid Form - only show for authenticated users who are not the seller */}
          {isAuctionScheduled ? (
            <div className="bg-green-50 rounded-lg shadow-sm p-6 text-center border-2 border-primary-green">
              <h3 className="text-xl font-bold text-primary-green mb-3">Auction Not Started Yet</h3>
              <p className="text-green-800 mb-4">This auction is scheduled to start in the near future. Bidding will be available once the auction starts.</p>
              <p className="text-sm text-green-700">Auction Starts {new Date(auction.start_time).toLocaleString()}</p>
            </div>
          ) : canBid ? (
            <>
              <BidForm
                auction={auction}
                onBidSubmit={handleBidSubmit}
                isLoading={isSubmitting}
                error={bidError}
                userBalance={parseFloat(user?.balance) || 0}
              />

              {bidSuccess && (
                <div className="bg-success-green text-white px-4 py-3 rounded-lg text-center font-medium">
                  ✓ Your bid has been placed successfully!
                </div>
              )}
            </>
          ) : !isAuthenticated ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Want to place a bid?</h3>
              <p className="text-gray-600 mb-6">Please log in to participate in this auction.</p>
              <a href="/login" className="block w-full px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-all font-bold text-center">
                Login to Bid
              </a>
            </div>
          ) : isUserSeller ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Your Auction</h3>
              <p className="text-gray-600 mb-6">You are the seller of this auction.</p>
              <button onClick={() => navigate(`/manage-auctions/${id}`)} className="w-full px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-all font-bold">
                Manage This Auction
              </button>
            </div>
          ) : !isAuctionActive ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Auction Ended</h3>
              <p className="text-gray-600">This auction is no longer accepting bids.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
