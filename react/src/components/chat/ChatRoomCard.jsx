import React from 'react';

const formatRelativeTime = (isoDateString) => {
    if (!isoDateString) return '';
    const date = new Date(isoDateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    if (diffInDays === 1) return 'Kemarin';
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const ChatRoomCard = ({ room, isActive, onSelect, currentUser }) => {
    // Determine the name to display based on the user's role
    const isSeller = currentUser.role === 'SELLER';
    const roomName = isSeller ? (room.buyer_name || 'Unknown Buyer') : (room.store_name || 'Unknown Store');
    
    const originalLastMessage = room.last_message_preview || 'No messages yet...';
    const lastMessage = originalLastMessage.length > 50 
        ? originalLastMessage.slice(0, 50) + '...' 
        : originalLastMessage;

    // Only show the unread count if the current user was not the one who sent the last message.
    const amILastSender = currentUser && String(currentUser.user_id) === String(room.last_message_sender_id);
    const showUnreadBadge = room.unread_count > 0 && !amILastSender;
    
    const relativeTime = formatRelativeTime(room.last_message_at);

    return (
        <div
            className={`flex items-center p-4 cursor-pointer border-b border-gray-200 bg-white transition-all duration-200
                ${isActive ? 'bg-primary-green border-l-4 border-l-primary-green' : 'hover:bg-gray-50'}
                `}
            onClick={() => onSelect(room)}
        >
            <div className="w-12 h-12 rounded-full bg-primary-green mr-4 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {!isSeller && room.store_logo ? (
                    <img src={room.store_logo} alt={roomName} className="w-full h-full object-cover" />
                ) : (
                    roomName.charAt(0).toUpperCase()
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                    <p className="font-bold truncate text-gray-900">{roomName}</p>
                    <p className="text-xs text-gray-500 flex-shrink-0 ml-2 whitespace-nowrap">{relativeTime}</p>
                </div>
                <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-600 truncate pr-2">{lastMessage}</p>
                    {showUnreadBadge && (
                        <span className="bg-primary-green text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
                            {room.unread_count}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatRoomCard;