import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/CreateAuction.css';

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
    <div className="create-auction-page">
      <div className="page-header">
        <button onClick={() => navigate('/manage-auctions')} className="btn btn-secondary back-btn">
          ← Back to My Auctions
        </button>
        <h1>Create New Auction</h1>
        <p className="subtitle">Set up a new auction for one of your products</p>
      </div>

      {success ? (
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2>Auction Created Successfully!</h2>
          <p>Your auction is now live. Redirecting to auction management...</p>
        </div>
      ) : (
        <div className="create-auction-container">
          <form onSubmit={handleSubmit} className="auction-form">
            {error && (
              <div className="error-alert">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Product Selection */}
            <div className="form-section">
              <h3>Select Product</h3>
              <div className="form-group">
                <label htmlFor="product">Product to Auction</label>
                {productsLoading ? (
                  <div className="loading-products">Loading your products...</div>
                ) : products.length === 0 ? (
                  <div className="no-products">
                    <p>You don't have any products yet.</p>
                    <a href="/seller/products/add" className="btn btn-primary btn-sm">
                      Add Product
                    </a>
                  </div>
                ) : (
                  <select
                    id="product"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="form-select"
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
                <div className="product-preview">
                  <div className="preview-image">
                    {selectedProductDetails.main_image_path ? (
                      <img 
                        src={selectedProductDetails.main_image_path.startsWith('/') ? selectedProductDetails.main_image_path : `/public/images/products/${selectedProductDetails.main_image_path}`} 
                        alt={selectedProductDetails.product_name} 
                      />
                    ) : (
                      <div className="placeholder">No Image</div>
                    )}
                  </div>
                  <div className="preview-info">
                    <h4>{selectedProductDetails.product_name}</h4>
                    <p className="preview-price">
                      Original Price: Rp {parseFloat(selectedProductDetails.price).toLocaleString('id-ID')}
                    </p>
                    <p className="preview-description">
                      {selectedProductDetails.description?.substring(0, 100)}
                      {selectedProductDetails.description?.length > 100 ? '...' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Auction Settings */}
            <div className="form-section">
              <h3>Auction Settings</h3>
              
              <div className="form-group">
                <label htmlFor="initialBid">Starting Bid (Rp)</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">Rp</span>
                  <input
                    type="number"
                    id="initialBid"
                    value={initialBid}
                    onChange={(e) => setInitialBid(e.target.value)}
                    placeholder="e.g. 100000"
                    min="1000"
                    required
                    className="form-input"
                  />
                </div>
                <span className="form-hint">The minimum amount for the first bid</span>
              </div>

              <div className="form-group">
                <label htmlFor="minIncrement">Minimum Bid Increment (Rp)</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">Rp</span>
                  <input
                    type="number"
                    id="minIncrement"
                    value={minBidIncrement}
                    onChange={(e) => setMinBidIncrement(e.target.value)}
                    placeholder="e.g. 10000"
                    min="1000"
                    required
                    className="form-input"
                  />
                </div>
                <span className="form-hint">Each new bid must be at least this much higher</span>
              </div>
            </div>

            {/* Auction Rules Info */}
            <div className="form-section info-section">
              <h3>📋 Auction Rules</h3>
              <ul className="rules-list">
                <li>Auction starts immediately after creation</li>
                <li>Each bid resets the countdown to 15 seconds</li>
                <li>Auction ends when no bids are placed for 15 seconds</li>
                <li>Winner will be automatically charged and order created</li>
                <li>You can cancel the auction if there are no bids yet</li>
              </ul>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => navigate('/manage-auctions')} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
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
