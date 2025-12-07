export default function BidHistory({ bids = [] }) {
  if (bids.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">Bid History</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No bids yet. Be the first to bid!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">Bid History ({bids.length})</h3>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-600">
          <div>Bidder</div>
          <div className="text-right">Bid Amount</div>
          <div className="text-right">Time</div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {bids.map((bid, index) => (
            <div key={bid.id || index} className="grid grid-cols-3 gap-4 p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{bid.bidder_username}</span>
                {index === 0 && <span className="bg-primary-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded">HIGHEST</span>}
              </div>
              <div className="text-right font-bold text-primary-green">
                Rp {parseFloat(bid.bid_amount).toLocaleString('id-ID')}
              </div>
              <div className="text-right text-xs text-gray-500">
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
