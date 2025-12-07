import '../styles/BidHistory.css';

export default function BidHistory({ bids = [] }) {
  if (bids.length === 0) {
    return (
      <div className="bid-history">
        <h3>Bid History</h3>
        <div className="no-bids">
          <p>No bids yet. Be the first to bid!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bid-history">
      <h3>Bid History ({bids.length})</h3>
      <div className="bids-table">
        <div className="table-header">
          <div className="col-bidder">Bidder</div>
          <div className="col-amount">Bid Amount</div>
          <div className="col-time">Time</div>
        </div>
        <div className="table-body">
          {bids.map((bid, index) => (
            <div key={bid.id || index} className="table-row">
              <div className="col-bidder">
                <span className="username">{bid.bidder_username}</span>
                {index === 0 && <span className="highest-badge">HIGHEST</span>}
              </div>
              <div className="col-amount">
                Rp {parseFloat(bid.bid_amount).toLocaleString('id-ID')}
              </div>
              <div className="col-time">
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
