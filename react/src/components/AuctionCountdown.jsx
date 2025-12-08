import { useEffect, useState, useRef } from 'react';

export default function AuctionCountdown({ countdownSeconds, onExpired }) {
  const [displaySeconds, setDisplaySeconds] = useState(countdownSeconds);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    setDisplaySeconds(countdownSeconds);
    // Reset the expired flag when countdown is reset (new bid placed)
    if (countdownSeconds > 0) {
      hasExpiredRef.current = false;
    }
  }, [countdownSeconds]);

  // Call onExpired when countdown reaches 0
  useEffect(() => {
    if (displaySeconds !== null && displaySeconds <= 0 && !hasExpiredRef.current && onExpired) {
      hasExpiredRef.current = true;
      onExpired();
    }
  }, [displaySeconds, onExpired]);

  const formatCountdown = (seconds) => {
    if (!seconds || seconds <= 0) return 'EXPIRED';

    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (minutes < 60) {
      return `${minutes}m ${secs}s`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCountdownColors = () => {
    if (!displaySeconds) return 'bg-gray-500 border-gray-600 text-white';
    if (displaySeconds < 60) return 'bg-red-600 border-red-700 text-white animate-pulse';
    if (displaySeconds < 300) return 'bg-orange-500 border-orange-600 text-white';
    return 'bg-primary-green border-green-700 text-white';
  };

  return (
    <div className={`${getCountdownColors()} rounded-lg p-8 shadow-md border-2 text-center`}>
      <div className="text-sm font-bold opacity-95 mb-3 uppercase tracking-wider">Auction Ends In</div>
      <div className="text-5xl font-bold tracking-tight mb-3">
        {formatCountdown(displaySeconds)}
      </div>
      {displaySeconds && displaySeconds < 60 && (
        <div className="text-sm font-bold animate-pulse">
          ⚠️ Auction ending soon!
        </div>
      )}
    </div>
  );
}
