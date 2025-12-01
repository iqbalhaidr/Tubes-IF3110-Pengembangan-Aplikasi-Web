import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export function useAuction(auctionId) {
  const [auction, setAuction] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAuction = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/node/auctions/${auctionId}`);
      setAuction(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch auction');
      console.error('Error fetching auction:', err);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  const fetchBidHistory = useCallback(async () => {
    try {
      const response = await axios.get(`/api/node/auctions/${auctionId}/bids?limit=50`);
      setBidHistory(response.data.data);
    } catch (err) {
      console.error('Error fetching bid history:', err);
    }
  }, [auctionId]);

  useEffect(() => {
    if (auctionId) {
      fetchAuction();
      fetchBidHistory();
    }
  }, [auctionId, fetchAuction, fetchBidHistory]);

  return {
    auction,
    bidHistory,
    loading,
    error,
    refetch: fetchAuction,
    refetchBids: fetchBidHistory,
  };
}

export function useAuctionsList() {
  const [auctions, setAuctions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAuctions = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/node/auctions?page=${page}&limit=${limit}`
      );
      setAuctions(response.data.data);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch auctions');
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const goToPage = (page) => {
    fetchAuctions(page, pagination.limit);
  };

  const changeLimit = (limit) => {
    fetchAuctions(1, limit);
  };

  return {
    auctions,
    pagination,
    loading,
    error,
    goToPage,
    changeLimit,
    refetch: fetchAuctions,
  };
}

export function useBid(auctionId) {
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidError, setBidError] = useState(null);
  const [bidSuccess, setBidSuccess] = useState(false);

  const placeBid = useCallback(
    async (amount) => {
      try {
        setBidError(null);
        setBidSuccess(false);
        setIsSubmitting(true);

        const response = await axios.post(
          `/api/node/auctions/${auctionId}/bid`,
          { bid_amount: parseFloat(amount) },
          {
            withCredentials: true, // Send session cookies
          }
        );

        setBidSuccess(true);
        setBidAmount('');
        return response.data.data;
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || 'Failed to place bid';
        setBidError(errorMsg);
        console.error('Error placing bid:', err);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [auctionId]
  );

  const validateBid = useCallback((amount, currentBid, minIncrement) => {
    if (!amount || amount <= 0) {
      return 'Bid amount must be greater than 0';
    }
    const minimumBid = currentBid + minIncrement;
    if (amount < minimumBid) {
      return `Bid must be at least ${minimumBid.toLocaleString()}`;
    }
    return null;
  }, []);

  return {
    bidAmount,
    setBidAmount,
    isSubmitting,
    bidError,
    bidSuccess,
    placeBid,
    validateBid,
  };
}

export function useWebSocket(auctionId, userId) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(null);
  const [bidPlaced, setBidPlaced] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (!auctionId || !userId) return;

    import('socket.io-client').then(({ io: ioClient }) => {
      const newSocket = ioClient('/', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);

        newSocket.emit('join_auction', {
          auctionId,
          userId,
        });
      });

      newSocket.on('countdown_update', (data) => {
        setCountdownSeconds(data.secondsRemaining);
      });

      newSocket.on('bid_placed', (data) => {
        setBidPlaced(data);
      });

      newSocket.on('message_received', (data) => {
        setMessages((prev) => [data, ...prev]);
      });

      newSocket.on('user_typing', (data) => {
        setTypingUsers((prev) => new Set([...prev, data.userId]));
      });

      newSocket.on('user_stop_typing', (data) => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      newSocket.on('auction_ended', (data) => {
        console.log('[WebSocket] Auction ended:', data);
      });

      newSocket.on('auction_error', (data) => {
        console.error('[WebSocket] Error:', data);
      });

      newSocket.on('disconnect', () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_auction', {
          auctionId,
          userId,
        });
        socketRef.current.disconnect();
      }
    };
  }, [auctionId, userId]);

  const sendMessage = useCallback(
    (message, username) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('send_message', {
          auctionId,
          userId,
          username,
          message,
        });
      }
    },
    [auctionId, userId, isConnected]
  );

  const placeBidViaSocket = useCallback(
    (bidAmount) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('place_bid', {
          auctionId,
          userId,
          bidAmount,
        });
      }
    },
    [auctionId, userId, isConnected]
  );

  const setTyping = useCallback(
    (isTyping) => {
      if (socketRef.current && isConnected) {
        const event = isTyping ? 'typing' : 'stop_typing';
        socketRef.current.emit(event, {
          auctionId,
          userId,
        });
      }
    },
    [auctionId, userId, isConnected]
  );

  return {
    socket: socketRef.current,
    isConnected,
    countdownSeconds,
    bidPlaced,
    messages,
    typingUsers,
    sendMessage,
    placeBidViaSocket,
    setTyping,
  };
}

export default useAuction;
