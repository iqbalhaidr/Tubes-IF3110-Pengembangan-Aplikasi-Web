import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { debounce } from 'lodash';

const NewChatModal = ({ isOpen, onClose, onStoreSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchStores = useCallback(async (query) => {
        setLoading(true);
        try {
            const response = await api.get('/stores', {
                params: { search: query }
            });
            console.log("Fetched stores:", response.data);
            setStores(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedFetchStores = useCallback(debounce(fetchStores, 300), [fetchStores]);

    useEffect(() => {
        if (isOpen) {
            fetchStores('');
        }
    }, [isOpen, fetchStores]);

    useEffect(() => {
        if (isOpen) {
            debouncedFetchStores(searchQuery);
        }
        return () => {
            debouncedFetchStores.cancel();
        };
    }, [searchQuery, debouncedFetchStores, isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Start a New Chat</h2>
                    <input
                        type="text"
                        placeholder="Search for a store..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>
                <div className="p-4 h-80 overflow-y-auto">
                    {loading && <p className="text-center text-gray-500 py-8">Loading...</p>}
                    {!loading && stores.map(store => (
                        <div key={store.store_id} onClick={() => onStoreSelect(store.store_id)} className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-2">
                            <div className="w-12 h-12 rounded-full bg-primary-green mr-4 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                                {store.store_name.charAt(0)}
                            </div>
                            <span className="text-gray-900 font-medium">{store.store_name}</span>
                        </div>
                    ))}
                    {!loading && stores.length === 0 && <p className="text-center text-gray-500 py-8">No stores found.</p>}
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

export default NewChatModal;