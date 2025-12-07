import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.data.success === true) {
                setCurrentUser(response.data.data);
            }
        } catch (error) {
            console.error('Not authenticated or failed to fetch user:', error);
            setCurrentUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const value = {
        currentUser,
        isLoading,
        refetchUser: fetchUser, // Can be used to refetch user after login/logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
