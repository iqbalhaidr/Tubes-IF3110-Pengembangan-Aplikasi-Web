import { useState } from 'react';

export default function BidHistory({ bids = [], currentUserId = null }) {
  const [visibleCount, setVisibleCount] = useState(10);
  const visibleBids = bids.slice(0, visibleCount);
  const hasMore = visibleCount < bids.length;
  const uniqueBidders = new Set(bids.map(bid => bid.bidder_id)).size;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  if (bids.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gray-200 uppercase tracking-wide">Bid History</h3>
        <div className="text-center py-12">
          <p className="text-gray-600 font-medium">No bids yet. Be the first to bid!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Bid History ({bids.length})</h3>
        <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded">
          {uniqueBidders} {uniqueBidders === 1 ? 'bidder' : 'bidders'}
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-300 font-bold text-xs text-gray-700 uppercase tracking-wider">
          <div>Bidder</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Time</div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {visibleBids.map((bid, index) => (
            <div 
              key={bid.id || index} 
              className={`grid grid-cols-3 gap-4 p-4 border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                bid.bidder_id === currentUserId ? 'bg-green-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {bid.bidder_id === currentUserId ? 'You' : bid.bidder_username}
                </span>
                {index === 0 && <span className="bg-primary-green text-white text-[11px] font-bold px-2 py-1 rounded">HIGHEST</span>}
              </div>
              <div className="text-right font-bold text-primary-green text-base">
                Rp {parseFloat(bid.bid_amount).toLocaleString('id-ID')}
              </div>
              <div className="text-right text-xs text-gray-600 font-medium">
                {new Date(bid.placed_at).toLocaleString([], {
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Load More Bids
          </button>
        </div>
      )}
    </div>
  );
}
