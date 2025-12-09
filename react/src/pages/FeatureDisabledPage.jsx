import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const FeatureDisabledPage = () => {
    const location = useLocation();
    const { reason, isGlobal } = location.state || {};

    const title = isGlobal 
        ? "Feature Under Maintenance" 
        : "Feature Disabled";
    
    const message = reason || "This feature is currently not available for your account. Please contact support if you believe this is an error.";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
            <div className="max-w-lg bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <Link 
                    to="/home" 
                    className="px-6 py-2 bg-primary-green text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default FeatureDisabledPage;
