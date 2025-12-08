import React from 'react';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatPanel from '../components/chat/ChatPanel';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
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
  const { rooms, activeRoom, messages, loading, typingUsers, selectRoom, sendMessage, emitTyping, createOrSelectRoom, uploadImage } = useChat(currentUser);

  const handleSelectRoom = (room) => {
    selectRoom(room);
  };

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
          <PushNotificationButton userId={currentUser.user_id} />
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