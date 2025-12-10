import { useState } from 'react';
import axios from 'axios';
import '../styles/CreateAuctionModal.css';

/**
 * CreateAuctionModal Component
 * Modal dialog for creating an auction linked to a specific product
 * 
 * Props:
 *  - isOpen (boolean): Whether modal is visible
 *  - onClose (function): Callback when modal closes
 *  - product (object): Product data { product_id, product_name, main_image_path, price, stock }
 *  - onSuccess (function): Callback when auction created successfully
 */
export default function CreateAuctionModal({ isOpen, onClose, product, onSuccess }) {
  const [formData, setFormData] = useState({
    initialBid: '',
    minBidIncrement: '10000',
    auctionQuantity: '1',
    startTime: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !product) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.initialBid || parseFloat(formData.initialBid) <= 0) {
        throw new Error('Initial bid must be greater than 0');
      }

      if (!formData.minBidIncrement || parseFloat(formData.minBidIncrement) <= 0) {
        throw new Error('Minimum bid increment must be greater than 0');
      }

      if (!formData.auctionQuantity || parseInt(formData.auctionQuantity) <= 0) {
        throw new Error('Auction quantity must be greater than 0');
      }

      if (parseInt(formData.auctionQuantity) > product.stock) {
        throw new Error(`Auction quantity cannot exceed available stock (${product.stock})`);
      }

      // Prepare API payload
      const payload = {
        product_id: product.product_id,
        initial_bid: parseFloat(formData.initialBid),
        min_bid_increment: parseFloat(formData.minBidIncrement),
        auction_quantity: parseInt(formData.auctionQuantity),
      };

      // Add start_time if provided and it's in the future
      if (formData.startTime) {
        const startDate = new Date(formData.startTime);
        if (startDate > new Date()) {
          payload.start_time = startDate.toISOString();
        }
      }

      // Call backend API
      const response = await axios.post('/api/node/auctions', payload);

      if (response.data.success) {
        // Reset form and close modal
        setFormData({
          initialBid: '',
          minBidIncrement: '10000',
          auctionQuantity: '1',
          startTime: '',
        });
        onSuccess?.(response.data.data);
        onClose();
      } else {
        throw new Error(response.data.error || 'Failed to create auction');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      console.error('Error creating auction:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get minimum valid start time (now + 1 minute)
  const minStartTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="create-auction-modal">
        <div className="modal-header">
          <h2>Create Auction</h2>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>

        {/* Product Preview */}
        <div className="product-preview">
          <div className="product-image-container">
            <img 
              src={product.main_image_path || '/placeholder.jpg'} 
              alt={product.product_name}
              className="product-image"
            />
          </div>
          <div className="product-info">
            <h3>{product.product_name}</h3>
            <p className="product-price">Price: Rp {Number(product.price).toLocaleString('id-ID')}</p>
            <p className="product-stock">Stock: {product.stock} units</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auction-form">
          {error && <div className="error-message">{error}</div>}

          {/* Initial Bid */}
          <div className="form-group">
            <label htmlFor="initialBid">Initial Bid Amount *</label>
            <input
              id="initialBid"
              name="initialBid"
              type="number"
              placeholder="e.g., 100000"
              value={formData.initialBid}
              onChange={handleInputChange}
              disabled={loading}
              min="0"
              step="1000"
              required
            />
            <small>Minimum starting price for the auction</small>
          </div>

          {/* Minimum Bid Increment */}
          <div className="form-group">
            <label htmlFor="minBidIncrement">Minimum Bid Increment *</label>
            <input
              id="minBidIncrement"
              name="minBidIncrement"
              type="number"
              placeholder="e.g., 10000"
              value={formData.minBidIncrement}
              onChange={handleInputChange}
              disabled={loading}
              min="0"
              step="1000"
              required
            />
            <small>Minimum amount each successive bid must increase by</small>
          </div>

          {/* Auction Quantity */}
          <div className="form-group">
            <label htmlFor="auctionQuantity">Auction Quantity *</label>
            <input
              id="auctionQuantity"
              name="auctionQuantity"
              type="number"
              placeholder="1"
              value={formData.auctionQuantity}
              onChange={handleInputChange}
              disabled={loading}
              min="1"
              max={product.stock}
              required
            />
            <small>Number of units from this product to auction (max {product.stock})</small>
          </div>

          {/* Start Time (Optional) */}
          <div className="form-group">
            <label htmlFor="startTime">Start Time (Optional)</label>
            <input
              id="startTime"
              name="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={handleInputChange}
              disabled={loading}
              min={minStartTime}
            />
            <small>Leave empty to start immediately, or set for a scheduled start</small>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Creating Auction...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
