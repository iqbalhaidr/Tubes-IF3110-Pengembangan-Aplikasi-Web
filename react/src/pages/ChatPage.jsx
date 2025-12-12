import React, { useCallback } from 'react';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatPanel from '../components/chat/ChatPanel';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';

const ChatPage = () => {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { 
    rooms, activeRoom, messages, loading, loadingMore, hasMore, fetchMoreMessages,
    typingUsers, selectRoom, sendMessage, emitTyping, createOrSelectRoom, uploadImage 
  } = useChat(currentUser);

  const handleSelectRoom = (room) => {
    selectRoom(room);
  };

  if (isAuthLoading) {
    return <div className="h-screen w-full flex items-center justify-center"><p>Loading user data...</p></div>;
  }

  if (!currentUser) {
    return <div className="h-screen w-full flex items-center justify-center"><p>Please <a href="/auth/login" className="text-blue-500">log in</a> to use the chat.</p></div>;
  }

  const backUrl = currentUser.role === 'seller' ? '/seller/dashboard' : '/home';
  const backText = currentUser.role === 'seller' ? 'Back to Dashboard' : 'Back to Home';

  return (
    <div className="h-screen w-full flex bg-page-background text-main-text overflow-hidden">
      {/* Sidebar */}
      <div className={`
        ${activeRoom ? 'hidden' : 'flex'}
        w-full md:flex md:w-1/3 border-r border-secondary-text flex-col
      `}>
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
      </div>
      
      {/* Main Chat Panel */}
      <div className={`
        ${activeRoom ? 'flex' : 'hidden'}
        w-full md:flex md:w-2/3 flex-col
      `}>
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
          onBack={() => selectRoom(null)}
        />
      </div>
    </div>
  );
};

export default ChatPage;