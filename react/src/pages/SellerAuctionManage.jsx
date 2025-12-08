import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AuctionCountdown from '../components/AuctionCountdown';
import AuctionChat from '../components/AuctionChat';
import BidHistory from '../components/BidHistory';
import { useAuction, useWebSocket } from '../hooks/useAuction';

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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <button onClick={() => navigate('/manage-auctions')} className="mb-8 inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold">
        ← Back to My Auctions
      </button>

      <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary-green">
        <h1 className="text-4xl font-bold text-gray-900">Manage Auction</h1>
        <span className={`px-4 py-2 rounded-lg font-bold text-sm ${
          auction.status === 'ACTIVE' ? 'bg-green-100 text-green-900' : 
          auction.status === 'ENDED' ? 'bg-blue-100 text-blue-900' : 
          'bg-red-100 text-red-900'
        }`}>
          {auction.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Info & Countdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image/Info */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="aspect-video w-full bg-gray-100 flex items-center justify-center">
              {productImageUrl ? (
                <img src={productImageUrl} alt={auction.product_name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-lg font-medium">No Image</div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{auction.product_name}</h2>
              <p className="text-gray-700 mb-6 leading-relaxed">{auction.product_description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <strong className="block text-gray-700 mb-2 font-semibold uppercase tracking-wide text-xs">Current Bid</strong>
                  <span className="text-2xl font-bold text-primary-green">Rp {parseFloat(auction.current_bid).toLocaleString('id-ID')}</span>
                </div>
                {auction.highest_bidder_username && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <strong className="block text-gray-700 mb-2 font-semibold uppercase tracking-wide text-xs">Highest Bidder</strong>
                    <span className="text-lg font-medium text-gray-900">{auction.highest_bidder_username}</span>
                  </div>
                )}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <strong className="block text-gray-700 mb-2 font-semibold uppercase tracking-wide text-xs">Total Bids</strong>
                  <span className="text-lg font-medium text-gray-900">{bidHistory.length}</span>
                </div>
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
            <div className={`bg-white rounded-lg shadow-sm p-6 text-center border-l-4 ${
              auction.status === 'ENDED' ? 'border-primary-green' : 'border-red-500'
            }`}>
              {auction.status === 'ENDED' && (
                <>
                  <strong className="block text-2xl text-gray-900 mb-4 font-bold">Auction Ended</strong>
                  {auction.winner_id ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Winner</div>
                      <div className="text-xl font-bold text-primary-green">{auction.winner_username}</div>
                      <div className="text-2xl font-bold text-gray-900 mt-2">Rp {parseFloat(auction.current_bid).toLocaleString('id-ID')}</div>
                    </div>
                  ) : (
                    <p className="text-gray-600 font-medium">No bids were placed on this auction</p>
                  )}
                </>
              )}
              {auction.status === 'CANCELLED' && (
                <strong className="block text-2xl text-red-600 font-bold">Auction Cancelled</strong>
              )}
            </div>
          )}

          {/* Bid History */}
          <BidHistory bids={bidHistory} />
        </div>

        {/* Right Column: Seller Actions & Chat */}
        <div className="space-y-6">
          {/* Seller Actions */}
          {isAuctionActive && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Seller Actions</h3>
              
              {actionError && (
                <div className="border-l-4 border-red-500 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 font-medium">{actionError}</div>
              )}
              
              <div className="space-y-3">
                {hasBids && (
                  <button 
                    onClick={handleAcceptBid}
                    className="w-full px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : '✓ Accept Current Bid'}
                  </button>
                )}
                
                {!hasBids && (
                  <button 
                    onClick={handleCancelAuction}
                    className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : '✕ Cancel Auction'}
                  </button>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                {hasBids 
                  ? 'Accept the current bid to end the auction immediately and create an order.'
                  : 'You can cancel the auction since there are no bids yet.'}
              </p>
            </div>
          )}

          {!isAuctionActive && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Auction {auction.status === 'ENDED' ? 'Completed' : 'Cancelled'}</h3>
              {auction.status === 'ENDED' && auction.winner_id ? (
                <p className="text-gray-600 mb-4 leading-relaxed">The order has been created for the winner. Check your orders page for details.</p>
              ) : (
                <p className="text-gray-600 mb-4 leading-relaxed">This auction has ended.</p>
              )}
              <a href="/seller/orders" className="inline-block w-full px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-green-700 transition-all font-bold text-center active:scale-95">
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
