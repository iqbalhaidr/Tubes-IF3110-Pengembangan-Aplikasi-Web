import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductReviewStats({ productId, compact = false }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [productId]);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`/api/node/reviews/product/${productId}`, {
                params: { limit: 1, page: 1 }
            });
            setStats(response.data.stats);
        } catch (err) {
            console.error('Error fetching review stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return null;
    }

    if (compact) {
        // Compact view for product cards
        return (
            <div className="flex items-center gap-2">
                <span className="text-yellow-500 font-bold text-sm">
                    {parseFloat(stats.average_rating).toFixed(1)}★
                </span>
                <span className="text-gray-600 text-xs">
                    ({stats.total_reviews})
                </span>
            </div>
        );
    }

    // Full view for product detail pages
    return (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Review Summary</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Average Rating */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 font-medium mb-1">Average Rating</p>
                    <p className="text-4xl font-bold text-gray-900">
                        {parseFloat(stats.average_rating).toFixed(1)}
                    </p>
                    <span className="text-2xl text-yellow-500">★</span>
                    <p className="text-xs text-gray-500 mt-2">Based on {stats.total_reviews} reviews</p>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(rating => {
                        const count = stats.distribution[rating];
                        const percentage = stats.total_reviews > 0 
                            ? Math.round((count / stats.total_reviews) * 100) 
                            : 0;
                        return (
                            <div key={rating} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-700 w-12">{rating}★</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${
                                            rating >= 4 ? 'bg-green-500' :
                                            rating === 3 ? 'bg-yellow-500' :
                                            'bg-red-500'
                                        }`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-xs font-medium text-gray-600 w-12 text-right">
                                    {percentage}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Star breakdown table */}
            <div className="grid grid-cols-5 gap-2 text-center">
                {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} className="bg-gray-50 rounded p-3">
                        <p className="text-lg font-bold text-gray-900">{stats.distribution[rating]}</p>
                        <p className="text-xs text-gray-600 font-medium">{rating}★</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
