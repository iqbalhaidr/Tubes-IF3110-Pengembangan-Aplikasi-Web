import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function SellerReviewPanel() {
    const { currentUser, isLoading: isAuthLoading } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('all'); // all, with-response, no-response
    const [expandedReview, setExpandedReview] = useState(null);
    const [responseText, setResponseText] = useState({});
    const [actionLoading, setActionLoading] = useState(false);

    // Auth check
    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-center text-gray-600 font-medium">Loading user data...</p>
            </div>
        );
    }

    if (!currentUser || currentUser.role !== 'SELLER') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-center text-gray-600 font-medium">
                    Please <a href="/auth/login" className="text-primary-green hover:underline font-semibold">log in</a> as a seller to view reviews.
                </p>
            </div>
        );
    }

    useEffect(() => {
        const loadReviews = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/node/reviews/seller', {
                    params: {
                        page,
                        limit: 10
                    },
                    withCredentials: true
                });

                let filteredReviews = response.data.reviews;
                
                if (filter === 'with-response') {
                    filteredReviews = filteredReviews.filter(r => r.response_id);
                } else if (filter === 'no-response') {
                    filteredReviews = filteredReviews.filter(r => !r.response_id);
                }

                setReviews(filteredReviews);
                setTotalPages(response.data.pagination.total_pages);
                setError('');
            } catch (err) {
                console.error('Error fetching reviews:', err);
                setError('Failed to load reviews');
            } finally {
                setLoading(false);
            }
        };

        loadReviews();
    }, [page, filter]);

    const fetchSellerReviews = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/node/reviews/seller', {
                params: {
                    page,
                    limit: 10
                },
                withCredentials: true
            });

            let filteredReviews = response.data.reviews;
            
            if (filter === 'with-response') {
                filteredReviews = filteredReviews.filter(r => r.response_id);
            } else if (filter === 'no-response') {
                filteredReviews = filteredReviews.filter(r => !r.response_id);
            }

            setReviews(filteredReviews);
            setTotalPages(response.data.pagination.total_pages);
            setError('');
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveResponse = async (reviewId) => {
        if (!responseText[reviewId] || responseText[reviewId].trim() === '') {
            alert('Please enter a response');
            return;
        }

        try {
            setActionLoading(true);
            
            await axios.post(`/api/node/reviews/${reviewId}/response`, {
                response_text: responseText[reviewId]
            }, {
                withCredentials: true
            });

            setResponseText(prev => ({ ...prev, [reviewId]: '' }));
            setExpandedReview(null);
            await fetchSellerReviews();
        } catch (err) {
            console.error('Error saving response:', err);
            alert(err.response?.data?.error || 'Failed to save response');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleExpandReview = (reviewId) => {
        setExpandedReview(expandedReview === reviewId ? null : reviewId);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <p className="text-center text-gray-600 font-medium">Loading reviews...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
                    </div>
                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-4">
                        <button 
                            className={`px-4 py-2 font-semibold rounded-t-lg transition ${
                                filter === 'all' 
                                    ? 'bg-primary-green text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => {
                                setFilter('all');
                                setPage(1);
                            }}
                        >
                            All Reviews ({reviews.length})
                        </button>
                        <button 
                            className={`px-4 py-2 font-semibold rounded-t-lg transition ${
                                filter === 'with-response' 
                                    ? 'bg-primary-green text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => {
                                setFilter('with-response');
                                setPage(1);
                            }}
                        >
                            With Response
                        </button>
                        <button 
                            className={`px-4 py-2 font-semibold rounded-t-lg transition ${
                                filter === 'no-response' 
                                    ? 'bg-primary-green text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => {
                                setFilter('no-response');
                                setPage(1);
                            }}
                        >
                            Need Response
                        </button>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium">
                        {error}
                    </div>
                )}

                {/* Empty State */}
                {reviews.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg font-medium">No reviews yet</p>
                    </div>
                ) : (
                    <>
                        {/* Reviews List */}
                        <div className="space-y-5 mb-8">
                            {reviews.map(review => (
                                <div key={review.review_id} className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition p-6">
                                    {/* Review Header */}
                                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                {review.product_name}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-1">
                                                By <strong>{review.buyer_name}</strong>
                                            </p>
                                            <p className="text-sm text-yellow-500 font-semibold mb-2">
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} {review.rating}/5
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-start">
                                            {review.response_id ? (
                                                <span className="inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide bg-green-100 text-green-800">
                                                    ✓ Responded
                                                </span>
                                            ) : (
                                                <span className="inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide bg-yellow-100 text-yellow-800">
                                                    ⚠ Needs Response
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Review Content */}
                                    <div className="mb-4">
                                        <p className="text-gray-700 mb-3 leading-relaxed">
                                            {review.text}
                                        </p>

                                        {review.images && review.images.length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                                {review.images.map((img, idx) => (
                                                    img.image_path && (
                                                        <img 
                                                            key={idx}
                                                            src={img.image_path}
                                                            alt={`Review image ${idx + 1}`}
                                                            className="rounded border border-gray-200 hover:border-primary-green transition"
                                                        />
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Seller Response Display */}
                                    {review.response_id && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                            <div className="text-sm font-bold text-green-900 mb-2">Your Response</div>
                                            <p className="text-gray-700 mb-2">{review.response_text}</p>
                                            <p className="text-xs text-gray-500">
                                                Responded on {new Date(review.response_created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    {/* Expand Button */}
                                    <button 
                                        className="text-primary-green hover:text-primary-green-hover font-semibold text-sm mb-4"
                                        onClick={() => toggleExpandReview(review.review_id)}
                                    >
                                        {expandedReview === review.review_id ? '▼' : '▶'} 
                                        {review.response_id ? ' Edit' : ' Respond'}
                                    </button>

                                    {/* Response Form */}
                                    {expandedReview === review.review_id && !review.response_id && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                            <textarea
                                                placeholder="Write your response to this review..."
                                                value={responseText[review.review_id] || ''}
                                                onChange={(e) => {
                                                    if (e.target.value.length <= 500) {
                                                        setResponseText(prev => ({
                                                            ...prev,
                                                            [review.review_id]: e.target.value
                                                        }));
                                                    }
                                                }}
                                                rows="4"
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-green focus:ring-2 focus:ring-green-100 transition"
                                            />
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {(responseText[review.review_id] || '').length}/500
                                                </span>
                                                <button
                                                    className="px-4 py-2 bg-primary-green hover:bg-primary-green-hover text-white font-semibold rounded-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    onClick={() => handleSaveResponse(review.review_id)}
                                                    disabled={actionLoading}
                                                >
                                                    {actionLoading ? 'Saving...' : 'Post Response'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-6 mt-8">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-primary-green hover:text-primary-green transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ← Previous
                                </button>

                                <span className="text-gray-600 font-semibold text-sm">
                                    Page {page} of {totalPages}
                                </span>

                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-primary-green hover:text-primary-green transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
