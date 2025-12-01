import { useState, useRef, useEffect } from 'react';
import '../styles/AuctionChat.css';

export default function AuctionChat({
  auctionId,
  userId,
  messages = [],
  onSendMessage,
  onTyping,
  isConnected = false,
}) {
  const [messageText, setMessageText] = useState('');
  const [userName, setUserName] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.name || user?.username || 'Anonymous';
    } catch {
      return 'Anonymous';
    }
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessageChange = (e) => {
    const text = e.target.value;
    setMessageText(text);

    if (text && !isTyping && onTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageText.trim()) return;
    if (!onSendMessage) return;

    onSendMessage(messageText, userName);
    setMessageText('');
    setIsTyping(false);
    onTyping?.(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return (
    <div className="auction-chat">
      <div className="chat-header">
        <h3>Live Chat</h3>
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.userId === userId ? 'own' : 'other'}`}
            >
              <div className="message-header">
                <span className="username">{msg.username}</span>
                <span className="timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="message-text">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <div className="form-group">
          <input
            type="text"
            value={messageText}
            onChange={handleMessageChange}
            placeholder="Type a message..."
            disabled={!isConnected}
            maxLength={1000}
            className="message-input"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || !isConnected}
            className="btn btn-sm btn-primary"
          >
            Send
          </button>
        </div>
        {!isConnected && (
          <p className="connection-warning">
            ⚠️ Connection lost. Messages cannot be sent.
          </p>
        )}
      </form>
    </div>
  );
}
