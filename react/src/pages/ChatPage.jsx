import React, { useCallback } from 'react';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatPanel from '../components/chat/ChatPanel';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { VAPID_PUBLIC_KEY } from '../config';

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const ChatPage = () => {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { rooms, activeRoom, messages, loading, typingUsers, selectRoom, sendMessage, emitTyping, createOrSelectRoom, uploadImage } = useChat(currentUser);

  const handleSelectRoom = (room) => {
    selectRoom(room);
  };

  const handleSubscribe = useCallback(async () => {
    // ... (subscription logic remains the same)
  }, []);

  if (isAuthLoading) {
    return <div className="h-screen w-full flex items-center justify-center"><p>Loading user data...</p></div>;
  }

  if (!currentUser) {
    return <div className="h-screen w-full flex items-center justify-center"><p>Please <button onClick={() => window.location.href = '/auth/login'} className="text-blue-500 hover:underline font-semibold bg-none border-none cursor-pointer">log in</button> to use the chat.</p></div>;
  }

  const backUrl = currentUser.role === 'seller' ? '/seller/dashboard' : '/home';
  const backText = currentUser.role === 'seller' ? 'Back to Dashboard' : 'Back to Home';

  return (
    <div className="h-screen w-full flex bg-page-background text-main-text">
      <div className="w-1/3 border-r border-secondary-text flex flex-col">
        <div className="p-4 border-b border-secondary-text bg-background-main">
            <a href={backUrl} className="text-primary-green hover:underline font-semibold">
                &larr; {backText}
            </a>
        </div>
        <ChatSidebar 
          currentUser={currentUser}
          rooms={rooms}
          activeRoom={activeRoom}
          onSelectRoom={handleSelectRoom}
          onStoreSelect={createOrSelectRoom}
          loading={loading.rooms}
        />
        <div className="p-4 border-t border-secondary-text">
          <button onClick={handleSubscribe} className="w-full bg-primary-green hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
            Enable Notifications
          </button>
        </div>
      </div>
      <div className="w-2/3 flex flex-col">
        <ChatPanel 
          activeRoom={activeRoom}
          messages={messages}
          loading={loading.messages}
          onSendMessage={sendMessage}
          onUploadImage={uploadImage}
          typingUsers={typingUsers}
          onTyping={emitTyping}
          currentUserId={currentUser.user_id}
        />
      </div>
    </div>
  );
};

export default ChatPage;