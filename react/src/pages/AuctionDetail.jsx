import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import BidForm from '../components/BidForm';
import AuctionCountdown from '../components/AuctionCountdown';
import AuctionChat from '../components/AuctionChat';
import BidHistory from '../components/BidHistory';
import { useAuction, useBid, useWebSocket } from '../hooks/useAuction';
import '../styles/AuctionDetail.css';

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
    return <div className="auction-detail loading">Loading auction...</div>;
  }

  if (error) {
    return (
      <div className="auction-detail error">
        <p>Error: {error}</p>
        <button onClick={() => navigate('/auctions')} className="btn btn-secondary">
          Back to Auctions
        </button>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="auction-detail error">
        <p>Auction not found</p>
        <button onClick={() => navigate('/auctions')} className="btn btn-secondary">
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
    <div className="auction-detail">
      <button onClick={() => navigate('/auctions')} className="btn btn-secondary back-btn">
        ← Back to Auctions
      </button>

      <div className="auction-container">
        {/* Left Column: Product Info & Countdown */}
        <div className="auction-main">
          {/* Product Image/Info */}
          <div className="product-section">
            <div className="product-image">
              {productImageUrl ? (
                <img src={productImageUrl} alt={auction.product_name} />
              ) : (
                <div className="placeholder">No Image</div>
              )}
            </div>
            <div className="product-info">
              <h2>{auction.product_name}</h2>
              <p className="description">{auction.product_description}</p>
              <div className="product-meta">
                <span className="seller">
                  <strong>Seller:</strong> {auction.seller_username}
                </span>
                {auction.seller_address && (
                  <span className="address">
                    <strong>Location:</strong> {auction.seller_address}
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
            <div className={`status-badge status-${auction.status.toLowerCase()}`}>
              {auction.status === 'ENDED' && (
                <>
                  <strong>Auction Ended</strong>
                  {auction.winner_id && (
                    <p>Winner: {auction.winner_username}</p>
                  )}
                </>
              )}
              {auction.status === 'CANCELLED' && (
                <strong>Auction Cancelled</strong>
              )}
            </div>
          )}

          {/* Bid History */}
          <BidHistory bids={bidHistory} />
        </div>

        {/* Right Column: Bid Form & Chat */}
        <div className="auction-sidebar">
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
                <div className="success-message">
                  ✓ Your bid has been placed successfully!
                </div>
              )}
            </>
          ) : !isAuthenticated ? (
            <div className="login-prompt">
              <h3>Want to place a bid?</h3>
              <p>Please log in to participate in this auction.</p>
              <a href="/login" className="btn btn-primary">Login to Bid</a>
            </div>
          ) : isUserSeller ? (
            <div className="seller-notice">
              <h3>Your Auction</h3>
              <p>You cannot bid on your own auction.</p>
            </div>
          ) : !isAuctionActive ? (
            <div className="auction-ended-notice">
              <h3>Auction Ended</h3>
              <p>This auction is no longer accepting bids.</p>
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
            <div className="chat-login-prompt">
              <h3>Auction Chat</h3>
              <p><a href="/login">Login</a> to join the conversation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
