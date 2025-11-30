import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BidForm from '../components/BidForm';
import AuctionCountdown from '../components/AuctionCountdown';
import AuctionChat from '../components/AuctionChat';
import BidHistory from '../components/BidHistory';
import { useAuction, useBid, useWebSocket } from '../hooks/useAuction';
import '../styles/AuctionDetail.css';

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userId] = useState(() => {
    return JSON.parse(localStorage.getItem('user'))?.user_id || 1;
  });

  const { auction, bidHistory, loading, error, refetch } = useAuction(id);
  const { bidAmount, setBidAmount, isSubmitting, bidError, bidSuccess, placeBid, validateBid } = useBid(id);
  const {
    isConnected,
    countdownSeconds,
    bidPlaced,
    messages,
    sendMessage,
    setTyping,
  } = useWebSocket(id, userId);

  useEffect(() => {
    if (bidPlaced) {
      refetch();
    }
  }, [bidPlaced, refetch]);

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
  const isUserSeller = userId === auction.seller_id;

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
              {auction.product_image ? (
                <img src={auction.product_image} alt={auction.product_name} />
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
                <span className="phone">
                  <strong>Phone:</strong> {auction.seller_phone}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown */}
          {isAuctionActive && (
            <AuctionCountdown
              countdownSeconds={countdownSeconds}
              onExpired={() => refetch()}
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
          {/* Bid Form */}
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

          {/* Chat Section */}
          <AuctionChat
            auctionId={id}
            userId={userId}
            messages={messages}
            onSendMessage={sendMessage}
            onTyping={setTyping}
            isConnected={isConnected}
          />
        </div>
      </div>
    </div>
  );
}
