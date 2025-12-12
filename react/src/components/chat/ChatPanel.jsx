import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import SelectItemPreviewModal from './SelectItemPreviewModal';
import { MessageListSkeleton } from './SkeletonLoader';

const ChatPanel = ({ 
  currentUser, activeRoom, messages, loading, onSendMessage, onBack,
  onUploadImage, typingUsers, onTyping, loadingMore, hasMore, onFetchMoreMessages
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageEndRef = useRef(null);
  const messageListRef = useRef(null);

  useEffect(() => {
    if (!loadingMore) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMore]);

  const handleScroll = () => {
    if (messageListRef.current?.scrollTop === 0 && hasMore && !loadingMore) {
      onFetchMoreMessages();
    }
  };

  if (!activeRoom) {
    return <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50"><p>Select a chat to start messaging.</p></div>;
  }

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendMessage({ content: inputValue });
      setInputValue('');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTyping(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onUploadImage(file);
  };

  const handleAttachClick = () => fileInputRef.current.click();
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProductSelected = (product) => {
    onSendMessage({
      messageType: 'item_preview',
      content: JSON.stringify(product),
      productId: product.product_id,
    });
    setIsItemModalOpen(false);
  };

  // Determine header details based on user role
  const isSeller = currentUser.role === 'SELLER';
  const displayName = isSeller ? activeRoom.buyer_name : activeRoom.store_name;
  const displayImage = isSeller ? null : activeRoom.store_logo;

  return (
    <>
      <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 flex items-center bg-white shadow-sm">
          <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100 md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-12 h-12 rounded-full bg-primary-green mr-4 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
            {displayImage ? (
              <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName ? displayName.charAt(0).toUpperCase() : '?'
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{displayName || 'Chat'}</h2>
            <p className="text-sm text-gray-600 font-medium">Online</p>
          </div>
        </div>

        {/* Message List */}
        <div ref={messageListRef} onScroll={handleScroll} className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {loading && <MessageListSkeleton />}
          {loadingMore && <div className="text-center text-gray-500 py-4">Loading more...</div>}
          {!loading && hasMore && <div className="text-center text-gray-400 text-xs py-4">Scroll up to load more</div>}
          
          {!loading && messages.map((msg) => <MessageBubble key={msg.message_id} message={msg} />)}
          <div ref={messageEndRef} />
          {!loading && messages.length === 0 && <div className="text-center text-gray-600 font-medium py-12">No messages yet. Say hi!</div>}
        </div>

        <TypingIndicator typingUsers={typingUsers} />

        {/* Chat Input */}
        <div className="p-3 sm:p-5 border-t border-gray-200 bg-white">
          <div className="relative flex items-center gap-3">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <button onClick={handleAttachClick} className="p-2.5 text-gray-600 hover:text-primary-green hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium" title="Upload Image">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <button onClick={() => setIsItemModalOpen(true)} className="p-2.5 text-gray-600 hover:text-primary-green hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium" title="Send Item Preview">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-30 transition-all duration-200 font-medium"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
            <button 
              className="bg-primary-green hover:bg-green-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-all duration-200 hover:shadow-md active:scale-95"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
      <SelectItemPreviewModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onProductSelect={handleProductSelected}
        storeId={activeRoom.store_id}
      />
    </>
  );
};

export default ChatPanel;