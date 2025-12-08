export default function BidHistory({ bids = [] }) {
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
      <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gray-200 uppercase tracking-wide">Bid History ({bids.length})</h3>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-300 font-bold text-xs text-gray-700 uppercase tracking-wider">
          <div>Bidder</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Time</div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {bids.map((bid, index) => (
            <div key={bid.id || index} className="grid grid-cols-3 gap-4 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{bid.bidder_username}</span>
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
    </div>
  );
}
