import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import axios from 'axios';

const SELLER_PRODUCTS_URL = '/api/seller/products';

// A modal for sellers to pick one of their own products to create an auction for.
export default function ProductPickerModal({ isOpen, onClose, onProductSelect }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchProducts = useCallback(async (query) => {
        if (!isOpen) return;
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${SELLER_PRODUCTS_URL}?search=${encodeURIComponent(query)}`, {
                withCredentials: true,
            });
            
            if (response.data.success) {
                const availableProducts = response.data.data.products.filter(p => !p.auction_status);
                setProducts(availableProducts);
            } else {
                throw new Error(response.data.message || 'Failed to fetch products');
            }
        } catch (err) {
            console.error('Failed to fetch seller products:', err);
            setError(err.message || 'Could not load your products.');
        } finally {
            setLoading(false);
        }
    }, [isOpen]);

    const debouncedFetch = useCallback(debounce(fetchProducts, 300), [fetchProducts]);

    useEffect(() => {
        if (isOpen) {
            fetchProducts('');
        }
    }, [isOpen, fetchProducts]);

    useEffect(() => {
        if (isOpen) {
            debouncedFetch(searchQuery);
        }
        return () => {
            debouncedFetch.cancel();
        };
    }, [searchQuery, debouncedFetch, isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Product for Auction</h2>
                    <input
                        type="text"
                        placeholder="Search your products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>

                <div className="p-4 h-96 overflow-y-auto">
                    {loading && <p className="text-center text-gray-500 py-8">Loading products...</p>}
                    {error && <p className="text-center text-red-500 py-8">{error}</p>}
                    {!loading && !error && products.map(product => (
                        <div 
                            key={product.product_id} 
                            onClick={() => onProductSelect(product.product_id)} 
                            className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-2"
                        >
                            <img 
                                src={product.main_image_path || '/placeholder.jpg'} 
                                alt={product.product_name} 
                                className="w-16 h-16 rounded-lg bg-gray-200 mr-4 object-cover flex-shrink-0"
                            />
                            <div className="flex-1">
                                <p className="text-gray-900 font-semibold">{product.product_name}</p>
                                <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                            </div>
                            <span className="text-primary-green font-bold">Rp {Number(product.price).toLocaleString('id-ID')}</span>
                        </div>
                    ))}
                    {!loading && !error && products.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            <p className="font-semibold">No available products found.</p>
                            <p className="text-sm">Products already in an auction will not appear here.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
