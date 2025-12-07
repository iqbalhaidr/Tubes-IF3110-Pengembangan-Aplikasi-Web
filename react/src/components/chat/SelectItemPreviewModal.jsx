import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { debounce } from 'lodash';

const SelectItemPreviewModal = ({ isOpen, onClose, onProductSelect, storeId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchProducts = useCallback(async (query) => {
        if (!storeId) return;
        setLoading(true);
        try {
            const response = await api.get('/products', {
                params: { 
                    search: query,
                    store_id: storeId 
                }
            });
            setProducts(response.data.products || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    const debouncedFetchProducts = useCallback(debounce(fetchProducts, 300), [fetchProducts]);

    useEffect(() => {
        if (isOpen) {
            fetchProducts('');
        }
    }, [isOpen, fetchProducts]);

    useEffect(() => {
        debouncedFetchProducts(searchQuery);
        return () => debouncedFetchProducts.cancel();
    }, [searchQuery, debouncedFetchProducts]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Select an Item to Preview</h2>
                    <input
                        type="text"
                        placeholder="Search for a product..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>
                <div className="p-4 h-80 overflow-y-auto">
                    {loading && <p className="text-center text-gray-500 py-8">Loading...</p>}
                    {!loading && products.map(product => (
                        <div key={product.product_id} onClick={() => onProductSelect(product)} className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-2">
                            <div className="w-12 h-12 rounded-lg bg-gray-200 mr-4 flex-shrink-0 flex items-center justify-center text-gray-600 font-bold overflow-hidden">
                                {product.main_image_path ? (
                                    <img src={product.main_image_path} alt={product.product_name} className="w-full h-full object-cover" />
                                ) : (
                                    product.product_name.charAt(0)
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-gray-900 font-medium">{product.product_name}</p>
                                <p className="text-sm text-primary-green font-bold">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    ))}
                    {!loading && products.length === 0 && <p className="text-center text-gray-500 py-8">No products found.</p>}
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectItemPreviewModal;