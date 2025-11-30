import { useEffect, useState } from 'react';
import '../styles/AuctionCountdown.css';

export default function AuctionCountdown({ countdownSeconds, onExpired }) {
  const [displaySeconds, setDisplaySeconds] = useState(countdownSeconds);

  useEffect(() => {
    setDisplaySeconds(countdownSeconds);
  }, [countdownSeconds]);

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

  const getCountdownClass = () => {
    if (!displaySeconds) return 'expired';
    if (displaySeconds < 60) return 'critical';
    if (displaySeconds < 300) return 'warning';
    return 'normal';
  };

  return (
    <div className={`auction-countdown ${getCountdownClass()}`}>
      <div className="countdown-label">Auction Ends In</div>
      <div className="countdown-display">
        {formatCountdown(displaySeconds)}
      </div>
      {displaySeconds && displaySeconds < 60 && (
        <div className="countdown-warning">
          Auction ending soon!
        </div>
      )}
    </div>
  );
}
