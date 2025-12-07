import { useState, useEffect } from 'react';

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
    return <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 flex items-center justify-center min-h-[200px] text-gray-500">Loading auction data...</div>;
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
    <div className="bg-white rounded-2xl p-6 shadow-md border-t-4 border-primary-green">
      <div className="mb-5 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-3 border-b border-gray-200">
          <span className="text-xs font-semibold text-gray-600">Current Bid:</span>
          <span className="text-sm font-bold text-gray-900">
            Rp {currentBid.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 border-b border-gray-200">
          <span className="text-xs font-semibold text-gray-600">Minimum Increment:</span>
          <span className="text-sm font-bold text-gray-900">
            Rp {minIncrement.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between items-center p-3.5 bg-gray-50 border-2 border-gray-200 rounded-lg -mx-3 -mb-px">
          <span className="text-xs font-bold text-gray-900">Minimum Next Bid:</span>
          <span className="text-base font-bold text-error-red">
            Rp {minimumBid.toLocaleString('id-ID')}
          </span>
        </div>
        {auction.highest_bidder_username && (
          <div className="flex justify-between items-center p-3 border-t border-gray-200 mt-1">
            <span className="text-xs font-semibold text-gray-600">Highest Bidder:</span>
            <span className="text-sm font-bold text-gray-900">{auction.highest_bidder_username}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="bidAmount" className="text-sm font-bold text-gray-900">Your Bid Amount (Rp)</label>
          <input
            id="bidAmount"
            type="number"
            value={bidAmount}
            onChange={handleChange}
            placeholder={minimumBid.toString()}
            min={minimumBid}
            step={auction.min_bid_increment}
            disabled={isLoading}
            className={`w-full px-4 py-3 border-2 ${validationError ? 'border-error-red' : 'border-gray-200'} rounded-lg text-sm text-gray-900 bg-gray-50 hover:border-primary-green hover:bg-white focus:outline-none focus:border-primary-green focus:bg-white focus:ring-4 focus:ring-primary-green focus:ring-opacity-10 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
          />
          {validationError && (
            <span className="text-error-red text-xs font-medium flex items-center gap-1">{validationError}</span>
          )}
          {error && <span className="text-error-red text-xs font-medium flex items-center gap-1">{error}</span>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-br from-primary-green to-green-700 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400"
        >
          {isLoading ? 'Placing Bid...' : 'Place Bid'}
        </button>
      </form>
    </div>
  );
}
