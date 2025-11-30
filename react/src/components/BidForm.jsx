import { useState } from 'react';
import '../styles/BidForm.css';

export default function BidForm({
  auction,
  onBidSubmit,
  isLoading = false,
  error = null,
}) {
  const [bidAmount, setBidAmount] = useState('');
  const [validationError, setValidationError] = useState(null);

  if (!auction) {
    return <div className="bid-form empty">Loading auction data...</div>;
  }

  const minimumBid = auction.current_bid + auction.min_bid_increment;

  const handleChange = (e) => {
    const value = e.target.value;
    setBidAmount(value);
    setValidationError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!bidAmount || bidAmount <= 0) {
      setValidationError('Bid amount must be greater than 0');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (amount < minimumBid) {
      setValidationError(
        `Bid must be at least ${minimumBid.toLocaleString()}`
      );
      return;
    }

    onBidSubmit(amount);
    setBidAmount('');
  };

  return (
    <div className="bid-form">
      <div className="bid-info">
        <div className="info-row">
          <span className="label">Current Bid:</span>
          <span className="value">
            Rp{auction.current_bid?.toLocaleString() || '0'}
          </span>
        </div>
        <div className="info-row">
          <span className="label">Minimum Increment:</span>
          <span className="value">
            Rp{auction.min_bid_increment?.toLocaleString() || '0'}
          </span>
        </div>
        <div className="info-row highlight">
          <span className="label">Minimum Next Bid:</span>
          <span className="value">
            Rp{minimumBid.toLocaleString()}
          </span>
        </div>
        {auction.highest_bidder_username && (
          <div className="info-row">
            <span className="label">Highest Bidder:</span>
            <span className="value">{auction.highest_bidder_username}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bid-input-form">
        <div className="form-group">
          <label htmlFor="bidAmount">Your Bid Amount (Rp)</label>
          <input
            id="bidAmount"
            type="number"
            value={bidAmount}
            onChange={handleChange}
            placeholder={minimumBid.toString()}
            min={minimumBid}
            step={auction.min_bid_increment}
            disabled={isLoading}
            className={validationError ? 'error' : ''}
          />
          {validationError && (
            <span className="error-message">{validationError}</span>
          )}
          {error && <span className="error-message">{error}</span>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-block"
        >
          {isLoading ? 'Placing Bid...' : 'Place Bid'}
        </button>
      </form>
    </div>
  );
}
