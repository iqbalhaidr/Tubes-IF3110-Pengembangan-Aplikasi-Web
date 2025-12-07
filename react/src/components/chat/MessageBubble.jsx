import React from 'react';
import ItemPreviewCard from './ItemPreviewCard';
import { useAuth } from '../../contexts/AuthContext';

const ReadReceipt = ({ isRead }) => (
    <span className={`ml-2 ${isRead ? 'text-green-200' : 'text-gray-400'}`}>
    </span>
);


const MessageBubble = ({ message }) => {
    const { currentUser } = useAuth();
    const isSender = currentUser && message.sender_id === currentUser.user_id;

    const renderContent = () => {
        if (message.message_type === 'image') {
            return (
                <img 
                    src={message.content} 
                    alt="Uploaded content" 
                    className="rounded-lg max-w-full h-auto"
                    style={{ maxWidth: '200px' }}
                />
            );
        }
        if (message.message_type === 'item_preview') {
            try {
                const product = JSON.parse(message.content);
                return <ItemPreviewCard product={product} />;
            } catch (e) {
                return <div className="text-sm italic text-gray-500">[Invalid item preview]</div>;
            }
        }
        return <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>;
    };

    return (
        <div className={`flex my-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
                isSender 
                ? 'bg-primary-green text-white bubble-sent' 
                : 'bg-white text-main-text bubble-received'
            }`}>
                {renderContent()}
                <div className="text-xs text-right mt-1 opacity-75 flex justify-end items-center">
                    <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isSender && <ReadReceipt isRead={message.is_read} />}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;