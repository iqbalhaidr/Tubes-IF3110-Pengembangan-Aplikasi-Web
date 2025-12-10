import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminModerationPanel() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [status, setStatus] = useState('PENDING');
    const [selectedReview, setSelectedReview] = useState(null);
    const [expandedReview, setExpandedReview] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchModerationQueue();
    }, [page, status]);

    const fetchModerationQueue = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            const response = await axios.get('/api/node/reviews/admin/moderation', {
                params: {
                    page,
                    limit: 10,
                    status
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setReviews(response.data.reviews);
            setTotalPages(response.data.pagination.total_pages);
            setError('');
        } catch (err) {
            console.error('Error fetching moderation queue:', err);
            setError('Failed to load flagged reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (queueId, newStatus) => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            
            await axios.put(`/api/node/reviews/admin/moderation/${queueId}`, {
                status: newStatus,
                admin_notes: adminNotes
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setAdminNotes('');
            setSelectedReview(null);
            await fetchModerationQueue();
        } catch (err) {
            console.error('Error updating moderation status:', err);
            setError('Failed to update review status');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleExpandReview = (reviewId) => {
        setExpandedReview(expandedReview === reviewId ? null : reviewId);
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Loading flagged reviews...</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Review Moderation Panel
                    </h1>
                    <div className="w-full sm:w-auto">
                        <select 
                            value={status} 
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        >
                            <option value="PENDING">Pending Review</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
                        {error}
                    </div>
                )}

            {reviews.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-500 text-lg font-medium">No flagged reviews to moderate</p>
                </div>
            ) : (
                <>
                    {/* Reviews List */}
                    <div className="space-y-5 mb-8">
                        {reviews.map(review => (
                            <div key={review.queue_id} className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
                                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                                            {review.product_name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-1">
                                            By <strong>{review.buyer_name}</strong> • 
                                            <span className="text-yellow-500 font-semibold ml-1">
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} {review.rating}/5
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500 mb-2">Store: {review.store_name}</p>
                                        <p className="text-sm bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 font-medium inline-block">
                                            <strong>Reason:</strong> {review.flagged_reason}
                                        </p>
                                    </div>
                                    <div className="flex items-start">
                                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
                                            review.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            review.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {review.status}
                                        </span>
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
                                                        alt={`Review ${idx + 1}`}
                                                        className="rounded border border-gray-200 hover:border-blue-500 transition"
                                                    />
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button 
                                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm mb-4"
                                    onClick={() => toggleExpandReview(review.queue_id)}
                                >
                                    {expandedReview === review.queue_id ? '▼' : '▶'} Details
                                </button>

                                {expandedReview === review.queue_id && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                        {review.admin_notes && (
                                            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                                <p className="text-sm font-bold text-gray-900 mb-2">Previous Notes:</p>
                                                <p className="text-sm text-gray-700">{review.admin_notes}</p>
                                            </div>
                                        )}

                                        <textarea
                                            placeholder="Add admin notes (optional)..."
                                            value={selectedReview === review.queue_id ? adminNotes : ''}
                                            onChange={(e) => {
                                                setSelectedReview(review.queue_id);
                                                setAdminNotes(e.target.value);
                                            }}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                            rows="3"
                                        />

                                        {status === 'PENDING' && (
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <button
                                                    className="flex-1 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 font-semibold rounded-lg transition text-sm"
                                                    onClick={() => handleUpdateStatus(review.queue_id, 'APPROVED')}
                                                    disabled={actionLoading}
                                                >
                                                    {actionLoading ? 'Processing...' : '✓ Approve'}
                                                </button>
                                                <button
                                                    className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold rounded-lg transition text-sm"
                                                    onClick={() => handleUpdateStatus(review.queue_id, 'REJECTED')}
                                                    disabled={actionLoading}
                                                >
                                                    {actionLoading ? 'Processing...' : '✕ Reject & Hide'}
                                                </button>
                                            </div>
                                        )}
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
                </>
            )}
            </div>
        </div>
    );
}
