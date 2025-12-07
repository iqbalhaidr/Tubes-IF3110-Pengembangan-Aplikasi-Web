import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import BidForm from '../components/BidForm';
import AuctionCountdown from '../components/AuctionCountdown';
import AuctionChat from '../components/AuctionChat';
import BidHistory from '../components/BidHistory';
import { useAuction, useBid, useWebSocket } from '../hooks/useAuction';

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Get user from localStorage (set by App.jsx auth check)
  const [user] = useState(() => {
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
    messages,
    sendMessage,
    setTyping,
  } = useWebSocket(id, userId);

  // When a bid is placed via WebSocket, immediately refresh auction and bid history
  useEffect(() => {
    if (bidPlaced) {
      refetch();
      refetchBids();
    }
  }, [bidPlaced, refetch, refetchBids]);

  // Handle auction expiration - call the end auction API
  const handleAuctionExpired = useCallback(async () => {
    try {
      // Call the end auction API
      await axios.put(`/api/node/auctions/${id}/end`);
      console.log('[Auction] Auction ended, order created if there was a winner');
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
      await placeBid(amount);
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

  const isAuctionActive = auction.status === 'ACTIVE';
  const isUserSeller = userId && userId === auction.seller_id;
  const canBid = isAuthenticated && !isUserSeller && isAuctionActive;

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
      <button onClick={() => navigate('/auctions')} className="mb-6 px-4 py-2 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors">
        ← Back to Auctions
      </button>

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
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <strong className="text-text-dark">Seller:</strong>
                  <span className="text-text-muted">{auction.seller_username}</span>
                </span>
                {auction.seller_address && (
                  <span className="flex items-center gap-2">
                    <strong className="text-text-dark">Location:</strong>
                    <span className="text-text-muted">{auction.seller_address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Countdown */}
          {isAuctionActive && (
            <AuctionCountdown
              countdownSeconds={countdownSeconds}
              onExpired={handleAuctionExpired}
            />
          )}

          {/* Status Badge */}
          {!isAuctionActive && (
            <div className={`bg-white rounded-xl shadow-md p-6 text-center ${
              auction.status === 'ENDED' ? 'border-l-4 border-primary-green' : 'border-l-4 border-error-red'
            }`}>
              {auction.status === 'ENDED' && (
                <>
                  <strong className="block text-2xl text-text-dark mb-4">🔨 Auction Ended</strong>
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

        {/* Right Column: Bid Form & Chat */}
        <div className="space-y-6">
          {/* Bid Form - only show for authenticated users who are not the seller */}
          {canBid ? (
            <>
              <BidForm
                auction={auction}
                onBidSubmit={handleBidSubmit}
                isLoading={isSubmitting}
                error={bidError}
              />

              {bidSuccess && (
                <div className="bg-success-green text-white px-4 py-3 rounded-lg text-center font-medium">
                  ✓ Your bid has been placed successfully!
                </div>
              )}
            </>
          ) : !isAuthenticated ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <h3 className="text-xl font-bold text-text-dark mb-3">Want to place a bid?</h3>
              <p className="text-text-muted mb-4">Please log in to participate in this auction.</p>
              <a href="/login" className="block w-full px-6 py-3 bg-gradient-to-r from-primary-green to-primary-green-light text-white rounded-lg hover:shadow-lg transition-all font-medium text-center">
                Login to Bid
              </a>
            </div>
          ) : isUserSeller ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <h3 className="text-xl font-bold text-text-dark mb-3">Your Auction</h3>
              <p className="text-text-muted mb-4">You cannot bid on your own auction.</p>
              <button onClick={() => navigate(`/manage-auctions/${id}`)} className="w-full px-6 py-3 bg-gradient-to-r from-primary-green to-primary-green-light text-white rounded-lg hover:shadow-lg transition-all font-medium">
                Manage This Auction
              </button>
            </div>
          ) : !isAuctionActive ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <h3 className="text-xl font-bold text-text-dark mb-3">Auction Ended</h3>
              <p className="text-text-muted">This auction is no longer accepting bids.</p>
            </div>
          ) : null}

          {/* Chat Section - only for authenticated users */}
          {isAuthenticated ? (
            <AuctionChat
              auctionId={id}
              userId={userId}
              messages={messages}
              onSendMessage={sendMessage}
              onTyping={setTyping}
              isConnected={isConnected}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <h3 className="text-xl font-bold text-text-dark mb-3">Auction Chat</h3>
              <p className="text-text-muted">
                <a href="/login" className="text-primary-green hover:underline font-medium">Login</a> to join the conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
