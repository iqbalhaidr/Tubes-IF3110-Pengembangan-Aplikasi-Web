import React, { useCallback } from 'react';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatPanel from '../components/chat/ChatPanel';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { VAPID_PUBLIC_KEY } from '../config';
import usePushNotification from '../hooks/usePushNotification';

// component to handle the UI and logic for push notification subscriptions.
const PushNotificationButton = ({ userId }) => {
  const { 
    permission, 
    subscription, 
    subscribeToPush, 
    unsubscribeFromPush,
    error,
    loading 
  } = usePushNotification();

  const handleSubscribe = async () => {
    try {
      await subscribeToPush(userId);
      alert('You are now subscribed to notifications!');
    } catch (err) {
      alert(`Subscription failed: ${err.message}`);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribeFromPush(userId);
      alert('You have unsubscribed from notifications.');
    } catch (err) {
      alert(`Unsubscription failed: ${err.message}`);
    }
  };

  if (loading) {
    return <button className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg cursor-not-allowed" disabled>Loading...</button>;
  }

  if (permission === 'denied') {
    return <p className="text-sm text-red-500 text-center">Notifications blocked. Please enable them in your browser settings.</p>;
  }

  if (subscription) {
    return (
      <button onClick={handleUnsubscribe} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
        Disable Notifications
      </button>
    );
  }

  return (
    <button onClick={handleSubscribe} className="w-full bg-primary-green hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
      Enable Notifications
    </button>
  );
};

const ChatPage = () => {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { 
    rooms, activeRoom, messages, loading, loadingMore, hasMore, fetchMoreMessages,
    typingUsers, selectRoom, sendMessage, emitTyping, createOrSelectRoom, uploadImage 
  } = useChat(currentUser);

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
    return <div className="h-screen w-full flex items-center justify-center"><p>Please <a href="/auth/login" className="text-blue-500">log in</a> to use the chat.</p></div>;
  }

  const backUrl = currentUser.role === 'seller' ? '/seller/dashboard' : '/home';
  const backText = currentUser.role === 'seller' ? 'Back to Dashboard' : 'Back to Home';

  return (
    <div className="h-screen w-full flex bg-page-background text-main-text">
      <div className="w-1/3 border-r border-secondary-text flex flex-col">
        <div className="p-4 border-b border-secondary-text bg-background-main flex-shrink-0">
            <a href={backUrl} className="text-primary-green hover:underline font-semibold">
                &larr; {backText}
            </a>
        </div>
        <div className="flex-grow min-h-0">
          <ChatSidebar 
            currentUser={currentUser}
            rooms={rooms}
            activeRoom={activeRoom}
            onSelectRoom={handleSelectRoom}
            onStoreSelect={createOrSelectRoom}
            loading={loading.rooms}
          />
        </div>
        <div className="p-4 border-t border-secondary-text flex-shrink-0">
           <PushNotificationButton userId={currentUser.user_id} />
        </div>
      </div>
      <div className="w-2/3 flex flex-col">
        <ChatPanel 
          currentUser={currentUser}
          activeRoom={activeRoom}
          messages={messages}
          loading={loading.messages}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onFetchMoreMessages={fetchMoreMessages}
          onSendMessage={sendMessage}
          onUploadImage={uploadImage}
          typingUsers={typingUsers}
          onTyping={emitTyping}
        />
      </div>
    </div>
  );
};

export default ChatPage;