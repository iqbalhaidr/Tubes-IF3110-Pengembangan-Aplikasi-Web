import React, { useState } from 'react';
import ChatRoomCard from './ChatRoomCard';
import NewChatModal from './NewChatModal';
import { ChatListSkeleton } from './SkeletonLoader';

const ChatSidebar = ({ rooms, activeRoom, onSelectRoom, loading, onStoreSelect, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStoreSelected = (storeId) => {
    onStoreSelect(storeId);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white border-r border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chats</h1>
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <ChatListSkeleton />}
          {!loading && rooms.length === 0 && (
              <div className="p-6 text-center text-gray-500">No conversations yet.</div>
          )}
          {!loading && rooms.map(room => (
              <ChatRoomCard
                  key={`${room.store_id}-${room.buyer_id}`}
                  room={room}
                  currentUser={currentUser}
                  isActive={activeRoom && activeRoom.store_id === room.store_id && activeRoom.buyer_id === room.buyer_id}
                  onSelect={onSelectRoom}
              />
          ))}
        </div>
        {currentUser && currentUser.role === 'BUYER' && (
          <div className="p-5 border-t border-gray-200">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-primary-green hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                New Chat
              </button>
          </div>
        )}
      </div>
      <NewChatModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStoreSelect={handleStoreSelected}
      />
    </>
  );
};

export default ChatSidebar;