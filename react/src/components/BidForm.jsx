import { useState, useEffect } from 'react';
import '../styles/BidForm.css';

export default function BidForm({
  auction,
  onBidSubmit,
  isLoading = false,
  error = null,
}) {
  const [bidAmount, setBidAmount] = useState('');
  const [validationError, setValidationError] = useState(null);

  // Calculate minimum bid
  const currentBid = parseFloat(auction?.current_bid) || 0;
  const minIncrement = parseFloat(auction?.min_bid_increment) || 0;
  const minimumBid = currentBid + minIncrement;

  // Autofill bid amount when auction data changes (new bids come in)
  useEffect(() => {
    if (auction) {
      setBidAmount(minimumBid.toString());
    }
  }, [currentBid, minIncrement]);

  if (!auction) {
    return <div className="bid-form empty">Loading auction data...</div>;
  }

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
            Rp{currentBid.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="info-row">
          <span className="label">Minimum Increment:</span>
          <span className="value">
            Rp{minIncrement.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="info-row highlight">
          <span className="label">Minimum Next Bid:</span>
          <span className="value">
            Rp{minimumBid.toLocaleString('id-ID')}
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
