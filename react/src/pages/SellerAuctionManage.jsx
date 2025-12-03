import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AuctionCountdown from '../components/AuctionCountdown';
import AuctionChat from '../components/AuctionChat';
import BidHistory from '../components/BidHistory';
import { useAuction, useWebSocket } from '../hooks/useAuction';
import '../styles/AuctionDetail.css';
import '../styles/SellerAuction.css';

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
    messages,
    sendMessage,
    setTyping,
  } = useWebSocket(id, userId);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

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
      await axios.put(`/api/node/auctions/${id}/end`);
      refetch();
    } catch (err) {
      console.log('[Auction] End auction response:', err.response?.data?.error || err.message);
      refetch();
    }
  }, [id, refetch]);

  // Accept current highest bid
  const handleAcceptBid = async () => {
    if (!window.confirm('Are you sure you want to accept this bid and end the auction?')) {
      return;
    }
    
    setActionLoading(true);
    setActionError('');
    
    try {
      await axios.post(`/api/node/auctions/${id}/accept`, {}, { withCredentials: true });
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to accept bid');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel auction
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
    return <div className="auction-detail loading">Loading auction...</div>;
  }

  if (error) {
    return (
      <div className="auction-detail error">
        <p>Error: {error}</p>
        <button onClick={() => navigate('/manage-auctions')} className="btn btn-secondary">
          Back to My Auctions
        </button>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="auction-detail error">
        <p>Auction not found</p>
        <button onClick={() => navigate('/manage-auctions')} className="btn btn-secondary">
          Back to My Auctions
        </button>
      </div>
    );
  }

  // Check if user is the seller
  const isOwner = userId && userId === auction.seller_id;
  if (!isOwner) {
    return (
      <div className="auction-detail error">
        <p>You don't have permission to manage this auction</p>
        <button onClick={() => navigate('/manage-auctions')} className="btn btn-secondary">
          Back to Auctions
        </button>
      </div>
    );
  }

  const isAuctionActive = auction.status === 'ACTIVE';
  const hasBids = auction.highest_bidder_id !== null;

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
    <div className="auction-detail seller-manage">
      <button onClick={() => navigate('/manage-auctions')} className="btn btn-secondary back-btn">
        ← Back to My Auctions
      </button>

      <div className="seller-manage-header">
        <h1>Manage Auction</h1>
        <span className={`status-indicator status-${auction.status.toLowerCase()}`}>
          {auction.status}
        </span>
      </div>

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
                <span className="current-bid">
                  <strong>Current Bid:</strong> 
                  <span className="bid-amount">Rp {parseFloat(auction.current_bid).toLocaleString('id-ID')}</span>
                </span>
                {auction.highest_bidder_username && (
                  <span className="highest-bidder">
                    <strong>Highest Bidder:</strong> {auction.highest_bidder_username}
                  </span>
                )}
                <span className="total-bids">
                  <strong>Total Bids:</strong> {bidHistory.length}
                </span>
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
                  <strong>🔨 Auction Ended</strong>
                  {auction.winner_id ? (
                    <div className="winner-info">
                      <div className="winner-label">Winner</div>
                      <div className="winner-name">{auction.winner_username}</div>
                      <div className="final-price">Rp {parseFloat(auction.current_bid).toLocaleString('id-ID')}</div>
                    </div>
                  ) : (
                    <p>No bids were placed on this auction</p>
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

        {/* Right Column: Seller Actions & Chat */}
        <div className="auction-sidebar">
          {/* Seller Actions */}
          {isAuctionActive && (
            <div className="seller-actions-card">
              <h3>Seller Actions</h3>
              
              {actionError && (
                <div className="action-error">{actionError}</div>
              )}
              
              <div className="action-buttons">
                {hasBids && (
                  <button 
                    onClick={handleAcceptBid}
                    className="btn btn-primary btn-accept"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : '✓ Accept Current Bid'}
                  </button>
                )}
                
                {!hasBids && (
                  <button 
                    onClick={handleCancelAuction}
                    className="btn btn-danger btn-cancel"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : '✕ Cancel Auction'}
                  </button>
                )}
              </div>
              
              <p className="action-hint">
                {hasBids 
                  ? 'Accept the current bid to end the auction immediately and create an order.'
                  : 'You can cancel the auction since there are no bids yet.'}
              </p>
            </div>
          )}

          {!isAuctionActive && (
            <div className="auction-ended-notice">
              <h3>Auction {auction.status === 'ENDED' ? 'Completed' : 'Cancelled'}</h3>
              {auction.status === 'ENDED' && auction.winner_id ? (
                <p>The order has been created for the winner. Check your orders page for details.</p>
              ) : (
                <p>This auction has ended.</p>
              )}
              <a href="/seller/orders" className="btn btn-primary">
                View Orders
              </a>
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
