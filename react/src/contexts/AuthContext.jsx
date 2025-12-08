import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children, user: initialUser }) => {
    const [currentUser, setCurrentUser] = useState(initialUser || null);
    const [isLoading, setIsLoading] = useState(!initialUser);

    const fetchUser = useCallback(async () => {
        try {
            const response = await fetch('/auth/me', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setCurrentUser(data.data);
                }
            }
        } catch (error) {
            console.error('Not authenticated or failed to fetch user:', error);
            setCurrentUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch user on mount if no initialUser provided
    useEffect(() => {
        if (!initialUser) {
            fetchUser();
        }
    }, [initialUser, fetchUser]);

    // Update currentUser when initialUser prop changes
    useEffect(() => {
        if (initialUser) {
            setCurrentUser(initialUser);
            setIsLoading(false);
        }
    }, [initialUser]);

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
