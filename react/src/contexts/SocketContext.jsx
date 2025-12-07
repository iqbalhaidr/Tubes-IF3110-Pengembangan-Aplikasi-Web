import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to the root namespace through the reverse proxy at /socket.io
        const newSocket = io('/', {
            withCredentials: true,
            transports: ['websocket'],
            autoConnect: true,
            path: '/socket.io', 
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[WebSocket] Connected to root namespace. Socket ID:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[WebSocket] Disconnected from root namespace. Reason:', reason);
            setIsConnected(false);
        });

        newSocket.on('authenticated', (data) => {
            console.log('[WebSocket] Authenticated successfully.', data);
        });

        newSocket.on('auth_error', (error) => {
            console.error('[WebSocket] Authentication error:', error.message);
        });

        newSocket.on('error', (error) => {
            console.error('[WebSocket] Server Error:', error.message || error);
        });

        // Cleanup on component unmount
        return () => {
            console.log('[WebSocket] Disconnecting socket...');
            newSocket.disconnect();
        };
    }, []);

    const value = {
        socket,
        isConnected,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
