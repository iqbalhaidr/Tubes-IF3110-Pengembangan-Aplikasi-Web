import { useState, useEffect } from 'react';

export default function BidForm({
  auction,
  onBidSubmit,
  isLoading = false,
  error = null,
  userBalance = 0,
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
    return <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex items-center justify-center min-h-[200px] text-gray-500 font-medium">Loading auction data...</div>;
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
        `Bid must be at least Rp ${minimumBid.toLocaleString('id-ID')}`
      );
      return;
    }

    if (amount > userBalance) {
      setValidationError(
        `Insufficient balance. Your balance: Rp ${userBalance.toLocaleString('id-ID')}`
      );
      return;
    }

    onBidSubmit(amount);
    setBidAmount('');
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-primary-green border-t-4">
      <div className="mb-6 space-y-2">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Current Bid</span>
          <span className="text-lg font-bold text-gray-900">
            {currentBid === 0 ? 'No bids yet' : `Rp ${currentBid.toLocaleString('id-ID')}`}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Minimum Increment</span>
          <span className="text-lg font-bold text-gray-900">
            Rp {minIncrement.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
          <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">Minimum Next Bid</span>
          <span className="text-lg font-bold text-orange-600">
            Rp {minimumBid.toLocaleString('id-ID')}
          </span>
        </div>
        {auction.highest_bidder_username && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Highest Bidder</span>
            <span className="text-sm font-bold text-gray-900">{auction.highest_bidder_username}</span>
          </div>
        )}
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Your Balance</span>
          <span className="text-lg font-bold text-primary-green">
            Rp {userBalance.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="bidAmount" className="text-sm font-bold text-gray-900 uppercase tracking-wide">Your Bid Amount (Rp)</label>
          <input
            id="bidAmount"
            type="number"
            value={bidAmount}
            onChange={handleChange}
            placeholder={minimumBid.toString()}
            min={minimumBid}
            step={auction.min_bid_increment}
            disabled={isLoading}
            className={`w-full px-4 py-3 border-2 ${validationError ? 'border-red-500' : 'border-gray-300'} rounded-lg text-base font-medium text-gray-900 bg-white hover:border-primary-green focus:outline-none focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-30 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200`}
          />
          {validationError && (
            <span className="text-red-600 text-xs font-semibold flex items-center gap-1">⚠ {validationError}</span>
          )}
          {error && <span className="text-red-600 text-xs font-semibold flex items-center gap-1">⚠ {error}</span>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-green text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 hover:shadow-md active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-green disabled:hover:shadow-sm text-base"
        >
          {isLoading ? 'Placing Bid...' : 'Place Bid'}
        </button>
      </form>
    </div>
  );
}
