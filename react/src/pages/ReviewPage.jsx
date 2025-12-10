import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function ReviewPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { currentUser, isLoading: isAuthLoading } = useAuth();

    // UI states
    const [activeProductId, setActiveProductId] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loadingOrder, setLoadingOrder] = useState(true);
    const [submittedReviews, setSubmittedReviews] = useState(new Set());

    // Form states - per product
    const [formDataByProduct, setFormDataByProduct] = useState({});
    const [imagesByProduct, setImagesByProduct] = useState({});
    const [imagePreviewsByProduct, setImagePreviewsByProduct] = useState({});
    const [loadingByProduct, setLoadingByProduct] = useState({});
    const [errorByProduct, setErrorByProduct] = useState({});
    const [successByProduct, setSuccessByProduct] = useState({});

    // Fetch order details to get order items
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                // Fetch from PHP backend to get order details
                const response = await axios.get(`/api/buyer-orders/detail?order_id=${orderId}`);
                const items = response.data.data?.items || [];
                setOrderItems(items);
                
                // Set first product as active
                if (items.length > 0) {
                    setActiveProductId(items[0].product_id);
                }

                // Initialize form states for all products
                const initialFormData = {};
                const initialImages = {};
                const initialPreviews = {};
                items.forEach(item => {
                    initialFormData[item.product_id] = { rating: 0, text: '' };
                    initialImages[item.product_id] = [];
                    initialPreviews[item.product_id] = [];
                });
                setFormDataByProduct(initialFormData);
                setImagesByProduct(initialImages);
                setImagePreviewsByProduct(initialPreviews);
            } catch (err) {
                console.error('Error fetching order details:', err);
                setErrorByProduct({ global: 'Failed to load order details' });
            } finally {
                setLoadingOrder(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    const handleStarClick = (productId, star) => {
        setFormDataByProduct(prev => ({
            ...prev,
            [productId]: { ...prev[productId], rating: star }
        }));
    };

    const handleTextChange = (productId, e) => {
        const text = e.target.value;
        if (text.length <= 500) {
            setFormDataByProduct(prev => ({
                ...prev,
                [productId]: { ...prev[productId], text }
            }));
        }
    };

    const handleImageSelect = (productId, e) => {
        const files = Array.from(e.target.files);
        const currentImages = imagesByProduct[productId] || [];
        
        if (files.length + currentImages.length > 3) {
            setErrorByProduct(prev => ({ ...prev, [productId]: 'Maximum 3 images allowed' }));
            return;
        }

        const newImages = [];
        const newPreviews = [];
        let loadedCount = 0;

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                setErrorByProduct(prev => ({ ...prev, [productId]: 'Each image must be less than 5MB' }));
                return;
            }

            newImages.push(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result);
                loadedCount++;
                if (loadedCount === files.length) {
                    setImagesByProduct(prev => ({
                        ...prev,
                        [productId]: [...currentImages, ...newImages]
                    }));
                    setImagePreviewsByProduct(prev => ({
                        ...prev,
                        [productId]: [...(prev[productId] || []), ...newPreviews]
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (productId, index) => {
        setImagesByProduct(prev => ({
            ...prev,
            [productId]: prev[productId].filter((_, i) => i !== index)
        }));
        setImagePreviewsByProduct(prev => ({
            ...prev,
            [productId]: prev[productId].filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e, productId) => {
        e.preventDefault();
        setErrorByProduct(prev => ({ ...prev, [productId]: '' }));
        setSuccessByProduct(prev => ({ ...prev, [productId]: false }));

        const formData = formDataByProduct[productId] || {};
        const images = imagesByProduct[productId] || [];

        // Validation
        if (formData.rating === 0) {
            setErrorByProduct(prev => ({ ...prev, [productId]: 'Please select a rating' }));
            return;
        }
        if (!formData.text.trim()) {
            setErrorByProduct(prev => ({ ...prev, [productId]: 'Please enter a review' }));
            return;
        }

        setLoadingByProduct(prev => ({ ...prev, [productId]: true }));

        try {
            if (!currentUser || !currentUser.user_id) {
                setErrorByProduct(prev => ({ ...prev, [productId]: 'User not authenticated' }));
                setLoadingByProduct(prev => ({ ...prev, [productId]: false }));
                return;
            }

            const formDataObj = new FormData();
            formDataObj.append('order_id', orderId);
            formDataObj.append('product_id', productId);
            formDataObj.append('rating', formData.rating);
            formDataObj.append('text', formData.text);
            formDataObj.append('user_id', currentUser.user_id);

            images.forEach(image => {
                formDataObj.append('images', image);
            });

            const response = await axios.post('/api/node/reviews', formDataObj, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setSuccessByProduct(prev => ({ ...prev, [productId]: true }));
                setSubmittedReviews(prev => new Set([...prev, productId]));

                // Reset form for this product
                setFormDataByProduct(prev => ({
                    ...prev,
                    [productId]: { rating: 0, text: '' }
                }));
                setImagesByProduct(prev => ({
                    ...prev,
                    [productId]: []
                }));
                setImagePreviewsByProduct(prev => ({
                    ...prev,
                    [productId]: []
                }));

                // Redirect after 2 seconds if all products are reviewed
                if (submittedReviews.size + 1 === orderItems.length) {
                    setTimeout(() => {
                        navigate(-1);
                    }, 2000);
                }
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            setErrorByProduct(prev => ({ 
                ...prev, 
                [productId]: err.response?.data?.error || 'Failed to submit review' 
            }));
        } finally {
            setLoadingByProduct(prev => ({ ...prev, [productId]: false }));
        }
    };

    if (isAuthLoading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Loading user data...</p></div>;
    }

    if (!currentUser) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Please <a href="/auth/login" className="text-green-500">log in</a> to write reviews.</p></div>;
    }

    if (loadingOrder) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Loading order details...</p></div>;
    }

    if (orderItems.length === 0) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">No items in this order</p></div>;
    }

    const currentProduct = orderItems.find(item => item.product_id === activeProductId);
    const currentFormData = formDataByProduct[activeProductId] || { rating: 0, text: '' };
    const currentImages = imagesByProduct[activeProductId] || [];
    const currentPreviews = imagePreviewsByProduct[activeProductId] || [];
    const currentError = errorByProduct[activeProductId] || '';
    const currentSuccess = successByProduct[activeProductId] || false;
    const currentLoading = loadingByProduct[activeProductId] || false;
    const isReviewed = submittedReviews.has(activeProductId);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-100 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Line 226 omitted */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">
                        Write Your Reviews
                    </h1>
                    <p className="text-green-100 mt-2">
                        {submittedReviews.size} of {orderItems.length} products reviewed
                    </p>
                </div>

                {/* Product Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                    <div className="flex overflow-x-auto p-4 gap-2">
                        {orderItems.map(item => (
                            <button
                                key={item.product_id}
                                onClick={() => setActiveProductId(item.product_id)}
                                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                                    activeProductId === item.product_id
                                        ? 'bg-green-600 text-white'
                                        : submittedReviews.has(item.product_id)
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                {submittedReviews.has(item.product_id) ? '✓ ' : ''}{item.product_name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-8 sm:p-10">
                    {/* Current Product Info */}
                    {currentProduct && (
                        <div className="mb-8 pb-6 border-b border-gray-200">
                            <p className="text-sm text-gray-600 font-medium">Currently reviewing:</p>
                            <p className="text-2xl font-bold text-gray-900">{currentProduct.product_name}</p>
                        </div>
                    )}

                    {currentSuccess && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                            <span className="text-green-700 text-xl">✓</span>
                            <p className="text-green-700 font-medium">Review submitted successfully!</p>
                        </div>
                    )}

                    {currentError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <span className="text-red-700 text-xl">✕</span>
                            <p className="text-red-700 font-medium">{currentError}</p>
                        </div>
                    )}

                    {isReviewed && !currentSuccess && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700 font-medium">✓ You've already reviewed this product</p>
                        </div>
                    )}

                    <form onSubmit={(e) => handleSubmit(e, activeProductId)} className="space-y-7">
                        {/* Star Rating */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                                Rating *
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        disabled={isReviewed}
                                        className={`text-4xl sm:text-5xl transition-all ${
                                            currentFormData.rating >= star 
                                                ? 'text-yellow-400 hover:text-yellow-500' 
                                                : 'text-gray-300 hover:text-yellow-300'
                                        } hover:scale-125 duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                                        onClick={() => handleStarClick(activeProductId, star)}
                                        title={`${star} star${star > 1 ? 's' : ''}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            {currentFormData.rating > 0 && (
                                <p className="mt-2 text-sm font-medium text-gray-600">
                                    {currentFormData.rating} / 5 stars
                                </p>
                            )}
                        </div>

                        {/* Review Text */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="text" className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">
                                    Your Review *
                                </label>
                                <span className="text-xs font-medium text-gray-500">
                                    {currentFormData.text.length}/500
                                </span>
                            </div>
                            <textarea
                                id="text"
                                value={currentFormData.text}
                                onChange={(e) => handleTextChange(activeProductId, e)}
                                disabled={isReviewed}
                                placeholder="Share your experience with this product..."
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition resize-vertical min-h-36 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                                Product Images (Optional)
                            </label>
                            <p className="text-xs text-gray-500 font-medium mb-3">
                                Max 3 images, 5MB each. Supported: JPG, PNG, GIF, WebP
                            </p>

                            <div className="mb-4">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleImageSelect(activeProductId, e)}
                                    disabled={currentImages.length >= 3 || isReviewed}
                                    id="image-input"
                                    className="hidden"
                                />
                                <label 
                                    htmlFor="image-input" 
                                    className={`block p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
                                        currentImages.length >= 3 || isReviewed
                                            ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed' 
                                            : 'border-green-500 bg-green-50 hover:bg-green-100 text-green-600'
                                    }`}
                                >
                                    {currentImages.length >= 3 
                                        ? '✓ Maximum images selected' 
                                        : '+ Click to select images or drag & drop'}
                                </label>
                            </div>

                            {/* Image Previews */}
                            {currentPreviews.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
                                    {currentPreviews.map((preview, index) => (
                                        <div key={index} className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                disabled={isReviewed}
                                                className="absolute top-1 right-1 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded flex items-center justify-center text-lg transition hover:scale-110 disabled:opacity-50"
                                                onClick={() => removeImage(activeProductId, index)}
                                                title="Remove image"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6">
                            <button
                                type="button"
                                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition uppercase tracking-wide text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                onClick={() => navigate(-1)}
                                disabled={currentLoading}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={currentLoading || isReviewed}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition uppercase tracking-wide text-sm disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {isReviewed ? '✓ Already Reviewed' : currentLoading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
