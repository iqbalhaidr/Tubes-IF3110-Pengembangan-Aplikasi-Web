import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateAuctionModal from '../components/CreateAuctionModal';

/**
 * CreateAuctionPage - Dedicated page for creating an auction for a specific product
 * Route: /seller/products/:productId/create-auction
 * 
 * Fetches product data and displays the CreateAuctionModal
 */
export default function CreateAuctionPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get user from localStorage
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  // Check if user is a seller
  useEffect(() => {
    if (!user || user.role !== 'SELLER') {
      navigate('/auctions');
    }
  }, [user, navigate]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch from PHP API
        const response = await axios.get(
          `/api/seller/products/${productId}`,
          { withCredentials: true }
        );

        if (response.data.success && response.data.data) {
          setProduct(response.data.data);
        } else {
          setError('Product not found or you do not own this product');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.response?.data?.error || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAuctionSuccess = (auctionData) => {
    // Redirect to the new auction detail page
    navigate(`/manage-auctions/${auctionData.id}`);
  };

  const handleModalClose = () => {
    // Go back to product management
    navigate('/seller/products');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-primary-green rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Product not found'}</p>
          <a 
            href="/seller/products" 
            className="inline-block bg-primary-green text-white font-bold px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Products
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CreateAuctionModal
        isOpen={true}
        product={product}
        onClose={handleModalClose}
        onSuccess={handleAuctionSuccess}
      />
    </div>
  );
}
