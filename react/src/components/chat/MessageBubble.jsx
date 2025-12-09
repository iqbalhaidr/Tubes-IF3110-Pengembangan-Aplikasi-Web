import React from 'react';
import ItemPreviewCard from './ItemPreviewCard';
import { useAuth } from '../../contexts/AuthContext';

const ReadReceipt = ({ isRead }) => {
    if (isRead) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
               <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
               <path d="M7 12l5 5l10 -10"></path>
               <path d="M2 12l5 5m5 -5l5 -5"></path>
            </svg>
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
           <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
           <path d="M5 12l5 5l10 -10"></path>
        </svg>
    );
};


const MessageBubble = ({ message }) => {
    const { currentUser } = useAuth();
    const isSender = currentUser && message.sender_id === currentUser.user_id;

    const renderContent = () => {
        if (message.message_type === 'image') {
            return (
                <img 
                    src={message.content} 
                    alt="Uploaded content" 
                    className="rounded-lg max-w-full h-auto shadow-sm"
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
        return <p className="text-sm font-medium" style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>;
    };

    return (
        <div className={`flex my-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                isSender 
                ? 'bg-primary-green text-white' 
                : 'bg-white text-gray-900 border border-gray-200'
            }`}>
                {renderContent()}
                <div className="text-xs text-right mt-2 opacity-80 flex justify-end items-center gap-1">
                    <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isSender && <ReadReceipt isRead={message.is_read} />}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;