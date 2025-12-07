import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CreateAuction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [initialBid, setInitialBid] = useState('');
  const [minBidIncrement, setMinBidIncrement] = useState('');
  
  // Get user from localStorage
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  // Fetch seller's products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        // Fetch products from PHP API
        const response = await fetch('/api/seller/products', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success && data.data) {
          // API returns { success: true, data: { products: [...], pagination: {...} } }
          const productsArray = Array.isArray(data.data.products) ? data.data.products : [];
          setProducts(productsArray);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    
    const bidAmount = parseFloat(initialBid);
    const incrementAmount = parseFloat(minBidIncrement);
    
    if (!bidAmount || bidAmount <= 0) {
      setError('Please enter a valid initial bid amount');
      return;
    }
    
    if (!incrementAmount || incrementAmount <= 0) {
      setError('Please enter a valid minimum bid increment');
      return;
    }
    
    if (incrementAmount > bidAmount) {
      setError('Minimum increment cannot be greater than initial bid');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(
        '/api/node/auctions',
        {
          product_id: parseInt(selectedProduct),
          initial_bid: bidAmount,
          min_bid_increment: incrementAmount,
        },
        {
          withCredentials: true,
        }
      );
      
      if (response.data.success) {
        setSuccess(true);
        // Redirect to auction management page after 2 seconds
        setTimeout(() => {
          navigate(`/manage-auctions/${response.data.data.id}`);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  // Safe find - ensure products is an array before calling find
  const selectedProductDetails = Array.isArray(products) && selectedProduct 
    ? products.find(p => p.product_id?.toString() === selectedProduct) 
    : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <button onClick={() => navigate('/manage-auctions')} className="mb-4 px-4 py-2 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors">
          ← Back to My Auctions
        </button>
        <h1 className="text-4xl font-bold text-text-dark mb-2">Create New Auction</h1>
        <p className="text-text-muted text-lg">Set up a new auction for one of your products</p>
      </div>

      {success ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl text-success-green mb-4">✓</div>
          <h2 className="text-3xl font-bold text-text-dark mb-3">Auction Created Successfully!</h2>
          <p className="text-text-muted text-lg">Your auction is now live. Redirecting to auction management...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="bg-error-red/10 border border-error-red text-error-red px-4 py-3 rounded-lg">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Product Selection */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-text-dark border-b border-gray-200 pb-3">Select Product</h3>
              <div className="space-y-2">
                <label htmlFor="product" className="block text-sm font-medium text-text-dark">Product to Auction</label>
                {productsLoading ? (
                  <div className="text-text-muted py-4 text-center">Loading your products...</div>
                ) : products.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-text-muted mb-4">You don't have any products yet.</p>
                    <a href="/seller/products/add" className="inline-block px-4 py-2 bg-gradient-to-r from-primary-green to-primary-green-light text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm">
                      Add Product
                    </a>
                  </div>
                ) : (
                  <select
                    id="product"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all"
                    required
                  >
                    <option value="">-- Select a product --</option>
                    {products.map((product) => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.product_name} - Rp {parseFloat(product.price).toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Product Preview */}
              {selectedProductDetails && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-4 mt-4">
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {selectedProductDetails.main_image_path ? (
                      <img 
                        src={selectedProductDetails.main_image_path.startsWith('/') ? selectedProductDetails.main_image_path : `/public/images/products/${selectedProductDetails.main_image_path}`} 
                        alt={selectedProductDetails.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-text-dark mb-1">{selectedProductDetails.product_name}</h4>
                    <p className="text-sm text-primary-green font-medium mb-2">
                      Original Price: Rp {parseFloat(selectedProductDetails.price).toLocaleString('id-ID')}
                    </p>
                    <p className="text-sm text-text-muted line-clamp-2">
                      {selectedProductDetails.description?.substring(0, 100)}
                      {selectedProductDetails.description?.length > 100 ? '...' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Auction Settings */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-text-dark border-b border-gray-200 pb-3">Auction Settings</h3>
              
              <div className="space-y-2">
                <label htmlFor="initialBid" className="block text-sm font-medium text-text-dark">Starting Bid (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">Rp</span>
                  <input
                    type="number"
                    id="initialBid"
                    value={initialBid}
                    onChange={(e) => setInitialBid(e.target.value)}
                    placeholder="e.g. 100000"
                    min="1000"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all"
                  />
                </div>
                <span className="block text-xs text-text-muted">The minimum amount for the first bid</span>
              </div>

              <div className="space-y-2">
                <label htmlFor="minIncrement" className="block text-sm font-medium text-text-dark">Minimum Bid Increment (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">Rp</span>
                  <input
                    type="number"
                    id="minIncrement"
                    value={minBidIncrement}
                    onChange={(e) => setMinBidIncrement(e.target.value)}
                    placeholder="e.g. 10000"
                    min="1000"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all"
                  />
                </div>
                <span className="block text-xs text-text-muted">Each new bid must be at least this much higher</span>
              </div>
            </div>

            {/* Auction Rules Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-text-dark mb-4">📋 Auction Rules</h3>
              <ul className="space-y-2 text-text-dark">
                <li className="flex items-start gap-2">
                  <span className="text-primary-green mt-1">•</span>
                  <span>Auction starts immediately after creation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-green mt-1">•</span>
                  <span>Each bid resets the countdown to 15 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-green mt-1">•</span>
                  <span>Auction ends when no bids are placed for 15 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-green mt-1">•</span>
                  <span>Winner will be automatically charged and order created</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-green mt-1">•</span>
                  <span>You can cancel the auction if there are no bids yet</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => navigate('/manage-auctions')} 
                className="flex-1 px-6 py-3 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-green to-primary-green-light text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !selectedProduct}
              >
                {loading ? 'Creating...' : 'Start Auction'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
