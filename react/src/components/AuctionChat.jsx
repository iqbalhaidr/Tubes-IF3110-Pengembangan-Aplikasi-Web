import { useState, useRef, useEffect } from 'react';

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
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[500px]">
      <div className="bg-primary-green text-white p-4 flex justify-between items-center">
        <h3 className="font-bold text-lg">Live Chat</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isConnected ? 'bg-green-900 bg-opacity-30' : 'bg-red-900 bg-opacity-30'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-gray-500 text-sm">No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.userId === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] rounded-lg p-3 ${msg.userId === userId ? 'bg-primary-green text-white bubble-sent' : 'bg-white text-gray-900 border border-gray-200 bubble-received'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-xs font-semibold ${msg.userId === userId ? 'text-green-100' : 'text-gray-700'}`}>{msg.username || 'User'}</span>
                  <span className={`text-[10px] ${msg.userId === userId ? 'text-green-200' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-sm leading-relaxed break-words">{msg.message}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={handleMessageChange}
            placeholder="Type a message..."
            disabled={!isConnected}
            maxLength={1000}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-20 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || !isConnected}
            className="bg-primary-green text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Send
          </button>
        </div>
        {!isConnected && (
          <p className="text-error-red text-xs mt-2 flex items-center gap-1">
            ⚠️ Connection lost. Messages cannot be sent.
          </p>
        )}
      </form>
    </div>
  );
}
