import React from 'react';

const ChatRoomCard = ({ room, isActive, onSelect, currentUser }) => {
    // Determine the name to display based on the user's role
    const isSeller = currentUser.role === 'SELLER';
    const roomName = isSeller ? (room.buyer_name || 'Unknown Buyer') : (room.store_name || 'Unknown Store');
    
    const lastMessage = room.last_message_preview || 'No messages yet...';

    // Only show the unread count if the current user was not the one who sent the last message.
    const amILastSender = currentUser && String(currentUser.user_id) === String(room.last_message_sender_id);
    const showUnreadBadge = room.unread_count > 0 && !amILastSender;
    
    return (
        <div
            className={`flex items-center p-4 cursor-pointer border-b border-gray-200 bg-white transition-all duration-200
                ${isActive ? 'bg-primary-green border-l-4 border-l-primary-green' : 'hover:bg-gray-50'}
                `}
            onClick={() => onSelect(room)}
        >
            <div className="w-12 h-12 rounded-full bg-primary-green mr-4 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                {roomName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                    <p className="font-bold truncate text-gray-900">{roomName}</p>
                    <p className="text-xs text-gray-500">{room.last_message_at ? new Date(room.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
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