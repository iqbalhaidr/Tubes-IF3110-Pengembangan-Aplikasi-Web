import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

export default function AuctionCountdown({ countdownSeconds, onExpired, auctionId, onRefetch = null }) {
  const [displaySeconds, setDisplaySeconds] = useState(countdownSeconds);
  const hasExpiredRef = useRef(false);
  const lastSyncTimeRef = useRef(Date.now());
  const syncIntervalRef = useRef(null);

  // Update display seconds when countdownSeconds changes (from WebSocket broadcast)
  useEffect(() => {
    setDisplaySeconds(countdownSeconds);
    // Reset the expired flag when countdown is reset (new bid placed)
    if (countdownSeconds > 0) {
      hasExpiredRef.current = false;
    }
    lastSyncTimeRef.current = Date.now();
  }, [countdownSeconds]);

  // Client-side countdown decrement every second
  useEffect(() => {
    if (displaySeconds <= 0) return;

    const interval = setInterval(() => {
      setDisplaySeconds((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [displaySeconds]);

  // Auto-sync with server every 30 seconds to correct drift
  useEffect(() => {
    if (!auctionId) return;

    const syncCountdown = async () => {
      try {
        const response = await axios.get(`/api/node/auctions/${auctionId}`);
        const serverCountdown = response.data.data.seconds_remaining || 0;
        
        // Only sync if there's a significant drift (more than 2 seconds)
        if (Math.abs(displaySeconds - serverCountdown) > 2) {
          console.log(`[Countdown] Drift detected. Local: ${displaySeconds}s, Server: ${serverCountdown}s. Syncing...`);
          setDisplaySeconds(serverCountdown);
          lastSyncTimeRef.current = Date.now();
        }
      } catch (err) {
        console.error('[Countdown] Auto-sync failed:', err);
      }
    };

    syncIntervalRef.current = setInterval(syncCountdown, 30000);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [auctionId, displaySeconds]);

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
      <div className="text-sm font-bold opacity-95 mb-3 uppercase tracking-wider">Time Remaining</div>
      <div className="text-5xl font-bold tracking-tight mb-3">
        {formatCountdown(displaySeconds)}
      </div>
      {displaySeconds && displaySeconds < 60 && (
        <div className="text-sm font-bold animate-pulse">
          Auction ending soon!
        </div>
      )}
    </div>
  );
}
