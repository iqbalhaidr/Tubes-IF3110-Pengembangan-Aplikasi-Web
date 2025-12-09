import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFeatureEnabled } from '../hooks/useFeatureFlags';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, feature }) => {
    const { currentUser } = useAuth();
    const { enabled, loading, reason, isGlobal } = useFeatureEnabled(feature, currentUser?.user_id);
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    if (!enabled) {
        return (
            <Navigate 
                to="/feature-disabled" 
                state={{ from: location, reason, isGlobal }} 
                replace 
            />
        );
    }

    return children;
};

export default ProtectedRoute;
