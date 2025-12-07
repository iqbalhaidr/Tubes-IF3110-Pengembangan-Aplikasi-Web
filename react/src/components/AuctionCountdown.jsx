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
    if (!displaySeconds) return 'bg-gray-500 border-gray-400';
    if (displaySeconds < 60) return 'bg-error-red border-red-600 animate-pulse';
    if (displaySeconds < 300) return 'bg-warning-orange border-orange-600';
    return 'bg-primary-green border-green-600';
  };

  return (
    <div className={`${getCountdownColors()} rounded-xl p-6 shadow-lg border-2 text-white text-center mb-6`}>
      <div className="text-sm font-semibold opacity-90 mb-2">Auction Ends In</div>
      <div className="text-4xl font-bold tracking-tight">
        {formatCountdown(displaySeconds)}
      </div>
      {displaySeconds && displaySeconds < 60 && (
        <div className="mt-3 text-sm font-semibold animate-pulse">
          ⚠️ Auction ending soon!
        </div>
      )}
    </div>
  );
}
