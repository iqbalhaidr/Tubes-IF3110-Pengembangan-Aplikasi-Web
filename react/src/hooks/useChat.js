import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { nodeApi } from '../api';

export const useChat = (currentUser) => {
    const { socket, isConnected } = useSocket();
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState({ rooms: false, messages: false });
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimers = useRef({});
    
    // Fetch all chat rooms for the user
    const fetchRooms = useCallback(async () => {
        setLoading(prev => ({ ...prev, rooms: true }));
        try {
            const response = await nodeApi.get('/chat/rooms');
            if (response.data.status === 'success') {
                setRooms(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch chat rooms:', error);
        } finally {
            setLoading(prev => ({ ...prev, rooms: false }));
        }
    }, []);

    // Fetch messages for a specific room
    const fetchMessages = useCallback(async (storeId, buyerId) => {
        setLoading(prev => ({ ...prev, messages: true }));
        setMessages([]); // Clear previous messages
        try {
            const response = await nodeApi.get(`/chat/rooms/${storeId}/${buyerId}/messages`);
            if (response.data.status === 'success') {
                setMessages(response.data.data.reverse());
            }
        } catch (error) {
            console.error(`Failed to fetch messages for room ${storeId}-${buyerId}:`, error);
        } finally {
            setLoading(prev => ({ ...prev, messages: false }));
        }
    }, []);

    useEffect(() => {
        // Fetch initial data when socket is connected
        if (isConnected && currentUser) {
            fetchRooms();
        }
    }, [isConnected, currentUser, fetchRooms]);

    // Set up socket event listeners
    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleNewMessage = (data) => {
            const newMessage = data.message;
            
            const isForActiveRoom = activeRoom && String(activeRoom.store_id) === String(newMessage.store_id) && String(activeRoom.buyer_id) === String(newMessage.buyer_id);
            const amISender = String(currentUser.user_id) === String(newMessage.sender_id);

            // Add message to active room if it matches
            if (isForActiveRoom) {
                setMessages(prevMessages => [...prevMessages, newMessage]);
            }

            // Update the room list
            setRooms(prevRooms => {
                const roomIndex = prevRooms.findIndex(
                    r => String(r.store_id) === String(newMessage.store_id) && String(r.buyer_id) === String(newMessage.buyer_id)
                );
                
                if (roomIndex > -1) {
                    const originalRoom = prevRooms[roomIndex];

                    // Determine the new unread count
                    let newUnreadCount = parseInt(originalRoom.unread_count, 10) || 0;

                    if (amISender) {
                        // If I am the sender, my unread count for this room should be 0.
                        newUnreadCount = 0;
                    } else if (!isForActiveRoom) {
                        // Only increment if I am the recipient AND the room is not active.
                        newUnreadCount++;
                    }

                    const updatedRoom = {
                        ...originalRoom,
                        last_message_preview: newMessage.content,
                        last_message_at: newMessage.created_at,
                        unread_count: newUnreadCount
                    };

                    // Move the updated room to the top of the list
                    const filteredRooms = prevRooms.filter(
                        r => String(r.store_id) !== String(newMessage.store_id) || String(r.buyer_id) !== String(newMessage.buyer_id)
                    );

                    return [updatedRoom, ...filteredRooms];
                }
                
                fetchRooms();
                return prevRooms;
            });
        };

        const handleUserTyping = ({ userId, isTyping }) => {
            setTypingUsers(prev => {
                const existingUser = prev.find(u => u.userId === userId);
                if (typingTimers.current[userId]) {
                    clearTimeout(typingTimers.current[userId]);
                }

                if (isTyping) {
                    typingTimers.current[userId] = setTimeout(() => {
                        setTypingUsers(current => current.filter(u => u.userId !== userId));
                    }, 3000);
                    if (!existingUser) return [...prev, { userId }];
                } else {
                    return prev.filter(u => u.userId !== userId);
                }
                return prev;
            });
        };

        const handleMessagesRead = ({ messageIds, readBy }) => {
            setMessages(prevMessages => {
                return prevMessages.map(msg => {
                    if (messageIds.includes(msg.message_id)) {
                        return { ...msg, is_read: true };
                    }
                    return msg;
                });
            });
        };

        socket.on('new_message', handleNewMessage);
        socket.on('user_typing', handleUserTyping);
        socket.on('messages_read', handleMessagesRead);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('user_typing', handleUserTyping);
            socket.off('messages_read', handleMessagesRead);
        };
    }, [socket, currentUser, activeRoom, fetchRooms]);

    const markRoomAsRead = useCallback((storeId, buyerId) => {
        if (socket) {
            socket.emit('mark_read', { storeId, buyerId });
            // Also optimistically update the main room list
            setRooms(prev => prev.map(r => 
                (r.store_id === storeId && r.buyer_id === buyerId)
                ? { ...r, unread_count: 0 }
                : r
            ));
        }
    }, [socket]);

    const selectRoom = useCallback((room) => {
        setTypingUsers([]);
        
        setActiveRoom(room);
        if (room) {
            fetchMessages(room.store_id, room.buyer_id);
            if (socket) {
                socket.emit('join_room', { 
                    storeId: room.store_id, 
                    buyerId: room.buyer_id 
                });
            }
            // Mark messages as read when entering the room
            markRoomAsRead(room.store_id, room.buyer_id);
        } else {
            setMessages([]);
        }
    }, [fetchMessages, socket, markRoomAsRead]);

    const sendMessage = useCallback((messageData) => {
        console.log('Attempting to send message...', { socket, activeRoom, messageData });
        if (socket && socket.connected && activeRoom && messageData.content) {
            socket.emit('send_message', {
                storeId: activeRoom.store_id,
                buyerId: activeRoom.buyer_id,
                messageType: messageData.messageType || 'text',
                content: messageData.content,
                productId: messageData.productId || null,
            });
            console.log('Message emitted.');
        } else {
            console.error('Cannot send message. Socket not connected or no active room.', { 
                isConnected: socket?.connected, 
                activeRoom 
            });
        }
    }, [socket, activeRoom]);

    const emitTyping = useCallback((isTyping) => {
        if (socket && activeRoom) {
            socket.emit('typing', {
                storeId: activeRoom.store_id,
                buyerId: activeRoom.buyer_id,
                isTyping
            });
        }
    }, [socket, activeRoom]);

    const createOrSelectRoom = useCallback(async (storeId) => {
        try {
            const response = await nodeApi.post('/chat/rooms', { store_id: storeId });
            console.log('Create/select room response:', response);
            if (response.data.status === 'success') {
                const newRoom = response.data.data;
                // Check if room is already in the list
                const roomExists = rooms.find(r => r.store_id === newRoom.store_id && r.buyer_id === newRoom.buyer_id);
                if (!roomExists) {
                    // Add to list if it's new
                    setRooms(prev => [newRoom, ...prev]);
                }
                // Make it the active room
                selectRoom(newRoom);
            }
        } catch (error) {
            console.error('Failed to create or select room:', error);
            // TODO: Handle error in UI
        }
    }, [rooms, selectRoom]);

    const uploadImage = useCallback(async (file) => {
        if (!activeRoom) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await nodeApi.post('/chat/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.status === 'success') {
                const imageUrl = response.data.data.url;
                // Send the image URL as a chat message
                sendMessage({
                    content: imageUrl,
                    messageType: 'image',
                });
            }
        } catch (error) {
            console.error('Failed to upload image:', error);
            // TODO: show error to user
        }
    }, [activeRoom, sendMessage]);

    return {
        rooms,
        activeRoom,
        messages,
        loading,
        typingUsers,
        selectRoom,
        fetchRooms,
        fetchMessages,
        sendMessage,
        emitTyping,
        markRoomAsRead,
        createOrSelectRoom,
        uploadImage,
    };
};
