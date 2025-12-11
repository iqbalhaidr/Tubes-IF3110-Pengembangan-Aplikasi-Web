import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductReviewsList({ productId }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState(null);
    const [ratingFilter, setRatingFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [expandedReview, setExpandedReview] = useState(null);
    const [userVotes, setUserVotes] = useState({});
    const [helpfulnessStats, setHelpfulnessStats] = useState({});

    useEffect(() => {
        fetchReviews();
    }, [productId, page, ratingFilter, sortBy]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/node/reviews/product/${productId}`, {
                params: {
                    page,
                    limit: 10,
                    sort: sortBy,
                    rating_filter: ratingFilter
                }
            });

            setReviews(response.data.reviews);
            setTotalPages(response.data.pagination.total_pages);
            setStats(response.data.stats);

            // Fetch helpfulness stats for each review
            const helpStats = {};
            for (const review of response.data.reviews) {
                try {
                    const helpResponse = await axios.get(
                        `/api/node/reviews/${review.review_id}/helpfulness`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`
                            }
                        }
                    );
                    helpStats[review.review_id] = helpResponse.data;
                } catch (err) {
                    console.error('Error fetching helpfulness:', err);
                }
            }
            setHelpfulnessStats(helpStats);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleHelpfulnessVote = async (reviewId, helpful) => {
        try {
            const response = await axios.post(
                `/api/node/reviews/${reviewId}/helpfulness`,
                { helpful },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            // Update local state
            setUserVotes(prev => ({
                ...prev,
                [reviewId]: response.data.vote_id ? helpful : null
            }));

            setHelpfulnessStats(prev => ({
                ...prev,
                [reviewId]: {
                    stats: response.data.helpfulness_stats,
                    user_vote: response.data.vote_id ? helpful : null
                }
            }));
        } catch (err) {
            console.error('Error voting on helpfulness:', err);
        }
    };

    const renderRatingDistribution = () => {
        if (!stats) return null;

        return (
            <div className="grid grid-cols-5 gap-2 text-center">
                {[5, 4, 3, 2, 1].map(rating => (
                    <button
                        key={rating}
                        onClick={() => {
                            setRatingFilter(ratingFilter === rating.toString() ? 'all' : rating.toString());
                            setPage(1);
                        }}
                        className={`p-3 rounded-lg transition ${
                            ratingFilter === rating.toString()
                                ? 'bg-yellow-400 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                    >
                        <div className="font-bold text-lg">{rating}★</div>
                        <div className="text-xs font-medium">{stats.distribution[rating]}</div>
                    </button>
                ))}
            </div>
        );
    };

    if (loading && reviews.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-gray-600 font-medium">Loading reviews...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            {/* Header with stats */}
            <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    Customer Reviews
                </h2>

                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 font-medium">Average Rating</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {parseFloat(stats.average_rating).toFixed(1)}
                                <span className="text-yellow-500 text-2xl">★</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{stats.total_reviews} reviews</p>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 font-medium">5 Stars</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.distribution[5]}</p>
                        </div>

                        <div className="bg-orange-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 font-medium">1 Star</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.distribution[1]}</p>
                        </div>
                    </div>
                )}

                {/* Rating distribution buttons */}
                <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Filter by Rating</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => {
                                setRatingFilter('all');
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                                ratingFilter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                            }`}
                        >
                            All Ratings
                        </button>
                        {[5, 4, 3, 2, 1].map(rating => (
                            <button
                                key={rating}
                                onClick={() => {
                                    setRatingFilter(rating.toString());
                                    setPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                                    ratingFilter === rating.toString()
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                }`}
                            >
                                {rating}★ {stats?.distribution[rating] || 0}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort options */}
                <div className="flex gap-2">
                    <p className="text-sm font-semibold text-gray-900 py-2">Sort by:</p>
                    {['recent', 'rating_high', 'rating_low', 'helpful'].map(option => (
                        <button
                            key={option}
                            onClick={() => {
                                setSortBy(option);
                                setPage(1);
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                sortBy === option
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                            }`}
                        >
                            {option === 'recent' && 'Recent'}
                            {option === 'rating_high' && 'Highest Rating'}
                            {option === 'rating_low' && 'Lowest Rating'}
                            {option === 'helpful' && 'Most Helpful'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-5">
                {reviews.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg font-medium">No reviews yet</p>
                    </div>
                ) : (
                    reviews.map(review => {
                        const helpStats = helpfulnessStats[review.review_id] || {
                            stats: { helpful_count: 0, not_helpful_count: 0 },
                            user_vote: null
                        };
                        const userVote = userVotes[review.review_id];

                        return (
                            <div
                                key={review.review_id}
                                className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition"
                            >
                                {/* Review Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-gray-200">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <p className="font-semibold text-gray-900">{review.buyer_name}</p>
                                            {review.is_verified_purchase && (
                                                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                    ✓ Verified Purchase
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-yellow-500 font-semibold">
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} {review.rating}/5
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Text */}
                                <p className="text-gray-700 mb-3 leading-relaxed">{review.text}</p>

                                {/* Images */}
                                {review.images && review.images.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        {review.images.map((img, idx) => (
                                            img.image_path && (
                                                <img
                                                    key={idx}
                                                    src={img.image_path}
                                                    alt={`Review ${idx + 1}`}
                                                    className="rounded border border-gray-200 hover:border-blue-500 transition cursor-pointer"
                                                />
                                            )
                                        ))}
                                    </div>
                                )}

                                {/* Seller Response */}
                                {review.response_id && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                        <p className="text-sm font-bold text-blue-900 mb-2">Seller Response</p>
                                        <p className="text-sm text-gray-700">{review.response_text}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(review.response_created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                )}

                                {/* Helpfulness voting */}
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-600 font-medium">Was this helpful?</span>
                                    <button
                                        onClick={() => handleHelpfulnessVote(review.review_id, true)}
                                        className={`px-3 py-1 rounded-lg transition font-medium ${
                                            userVote === true
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                        }`}
                                    >
                                        👍 {helpStats.stats.helpful_count}
                                    </button>
                                    <button
                                        onClick={() => handleHelpfulnessVote(review.review_id, false)}
                                        className={`px-3 py-1 rounded-lg transition font-medium ${
                                            userVote === false
                                                ? 'bg-red-500 text-white'
                                                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                        }`}
                                    >
                                        👎 {helpStats.stats.not_helpful_count}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Previous
                    </button>

                    <span className="text-gray-600 font-semibold text-sm">
                        Page {page} of {totalPages}
                    </span>

                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
