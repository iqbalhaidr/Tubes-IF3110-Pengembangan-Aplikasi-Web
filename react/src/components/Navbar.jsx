import { useState, useRef, useEffect } from 'react';
import './Navbar.css';
import { useFeatureEnabled, FEATURES } from '../hooks/useFeatureFlags';

/**
 * Navbar component - exact translation from PHP navbar.php
 * Provides consistent navigation between PHP and React sections
 */
export default function Navbar({ user, onLogout, onBalanceUpdate }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState('');
  const dropdownRef = useRef(null);

  // Feature flags
  const { enabled: chatEnabled } = useFeatureEnabled(FEATURES.CHAT_ENABLED, user?.userId);
  const { enabled: auctionEnabled } = useFeatureEnabled(FEATURES.AUCTION_ENABLED, user?.userId);
  
  // Determine navbar type based on user
  const navbarType = !user ? 'guest' : user.role === 'SELLER' ? 'seller' : 'buyer';
  const isSeller = navbarType === 'seller';
  const isBuyer = navbarType === 'buyer';
  const isGuest = navbarType === 'guest';
  
  // Quick top-up options
  const quickAmounts = [50000, 100000, 150000, 200000];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (logoutModalOpen) closeLogoutModal();
        if (topupModalOpen) closeTopupModal();
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [logoutModalOpen, topupModalOpen]);

  const openLogoutModal = () => {
    setLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setLogoutModalOpen(false);
  };

  const confirmLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/auth/logout';
    }
  };

  const openTopupModal = () => {
    setTopupModalOpen(true);
    setTopupAmount('');
    setTopupError('');
  };

  const closeTopupModal = () => {
    setTopupModalOpen(false);
    setTopupAmount('');
    setTopupError('');
  };

  const handleQuickAmount = (amount) => {
    setTopupAmount(amount.toString());
    setTopupError('');
  };

  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    
    const amount = parseInt(topupAmount, 10);
    
    // Validation
    if (!amount || isNaN(amount)) {
      setTopupError('Please enter a valid amount');
      return;
    }
    
    if (amount < 10000) {
      setTopupError('Minimum top-up amount is Rp 10.000');
      return;
    }
    
    if (amount > 10000000) {
      setTopupError('Maximum top-up amount is Rp 10.000.000');
      return;
    }
    
    setTopupLoading(true);
    setTopupError('');
    
    try {
      const response = await fetch('/balance/top-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ amount }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update balance in parent component
        if (onBalanceUpdate) {
          onBalanceUpdate(data.data.balance);
        }
        closeTopupModal();
      } else {
        setTopupError(data.message || 'Failed to top up balance');
      }
    } catch (error) {
      console.error('Top-up error:', error);
      setTopupError('Network error. Please try again.');
    } finally {
      setTopupLoading(false);
    }
  };

  // Handle modal overlay click
  const handleModalOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      closeLogoutModal();
    }
  };

  const handleTopupOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      closeTopupModal();
    }
  };

  // Base seller navigation links
  const baseSellerLinks = [
    { href: '/seller/dashboard', label: 'Dashboard', key: 'dashboard', flag: true },
    { href: '/chat', label: 'Chat', key: 'chat', flag: chatEnabled },
    { href: '/seller/products', label: 'Produk', key: 'products', flag: true },
    { href: '/seller/orders', label: 'Orders', key: 'orders', flag: true },
    { href: '/manage-auctions', label: 'Auctions', key: 'auctions', flag: auctionEnabled },
    { href: '/seller/reviews', label: 'Reviews', key: 'reviews', flag: true },
    { href: '/seller/settings', label: 'Settings', key: 'settings', flag: true },
  ];

  const sellerLinks = baseSellerLinks.filter(link => link.flag);

  return (
    <>
      <nav className={`navbar ${isSeller ? 'seller-navbar' : ''}`}>
        <div className="container navbar-container">
          <div className="navbar-left">
            {/* Guest: Link to landing page */}
            {isGuest && (
              <a href="/" className="navbar-brand">Nimonspedia</a>
            )}
            
            {/* Buyer: Link to home */}
            {isBuyer && (
              <>
                <a href="/home" className="navbar-brand">Nimonspedia</a>
                <div className="balance-display" id="balanceDisplay">
                  <span className="balance-label" id="balanceAmount">
                    Balance: Rp {(user?.balance ?? 0).toLocaleString('id-ID')}
                  </span>
                  <button 
                    type="button" 
                    className="balance-topup-btn" 
                    onClick={openTopupModal}
                  >
                    Top Up
                  </button>
                </div>
              </>
            )}
            
            {/* Seller: Link to dashboard */}
            {isSeller && (
              <>
                <a href="/seller/dashboard" className="navbar-brand">Nimonspedia</a>
                {user?.storeBalance !== undefined && (
                  <div className="balance-display seller-balance-display">
                    <span className="balance-label" id="storeBalanceAmount">
                      Store Balance: Rp {(user?.storeBalance ?? 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                <button 
                  className={`burger-menu ${mobileMenuOpen ? 'active' : ''}`}
                  id="mobileMenuToggle"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
                <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`} id="navbarMenu">
                  {sellerLinks.map((link) => (
                    <a 
                      key={link.key}
                      href={link.href} 
                      className={`navbar-link ${link.key === 'auctions' ? 'active' : ''}`}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div className="navbar-right">
            {/* Guest navigation */}
            {isGuest && (
              <div className="auth-links">
                <a href="/auth/login" className="navbar-link">Login</a>
                <a href="/auth/register" className="navbar-link">Daftar</a>
              </div>
            )}
            
            {/* Buyer navigation */}
            {isBuyer && (
              <>
                <a href="/cart" className="cart-icon" title="Shopping Cart">
                  <span className="cart-badge" id="cartBadge">{user?.cartCount ?? 0}</span>
                  <svg 
                    className="cart-icon-svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                </a>
                <div 
                  className={`user-dropdown ${dropdownOpen ? 'active' : ''}`}
                  ref={dropdownRef}
                >
                  <button 
                    className="user-profile-btn" 
                    id="userProfileBtn"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="user-avatar" id="userAvatar">
                      {(user?.name ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="user-name" id="userName">
                      {user?.name ?? 'User'}
                    </span>
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  <div className="user-dropdown-menu" id="userDropdownMenu">
                    <a href="/buyer/profile" className="dropdown-item">Profile</a>
                    <a href="/buyer/order-history" className="dropdown-item">Order History</a>
                    {chatEnabled && <a href="/chat" className="dropdown-item">Chat</a>}
                    {auctionEnabled && <a href="/auctions" className="dropdown-item">Live Auctions</a>}
                    <button 
                      type="button" 
                      className="dropdown-item" 
                      onClick={openLogoutModal}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
            
            {/* Seller logout */}
            {isSeller && (
              <button 
                type="button" 
                className="navbar-link logout-link" 
                onClick={openLogoutModal}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <div 
        id="logoutConfirmModal" 
        className={`modal-overlay logout-modal-overlay ${logoutModalOpen ? 'is-visible' : ''}`}
        aria-hidden={!logoutModalOpen}
        onClick={handleModalOverlayClick}
      >
        <div 
          className="modal-content logout-modal-content" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="logoutModalTitle"
        >
          <h2 id="logoutModalTitle">Confirm Logout</h2>
          <p>Are you sure you want to logout? You will need to login again to access your account.</p>
          <div className="modal-actions">
            <button 
              type="button" 
              className="modal-btn modal-btn-secondary" 
              onClick={closeLogoutModal}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="modal-btn modal-btn-danger" 
              onClick={confirmLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Top-up Modal */}
      <div 
        id="topupModal" 
        className={`modal-overlay topup-modal-overlay ${topupModalOpen ? 'is-visible' : ''}`}
        aria-hidden={!topupModalOpen}
        onClick={handleTopupOverlayClick}
      >
        <div 
          className="modal-content topup-modal-content" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="topupModalTitle"
        >
          <button 
            type="button" 
            className="modal-close-btn"
            onClick={closeTopupModal}
            aria-label="Close"
          >
            ×
          </button>
          <h2 id="topupModalTitle">Top Up Balance</h2>
          <p className="topup-subtitle">Add funds to your account</p>
          
          <form onSubmit={handleTopupSubmit} className="topup-form">
            <div className="topup-quick-amounts">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={`quick-amount-btn ${topupAmount === amount.toString() ? 'selected' : ''}`}
                  onClick={() => handleQuickAmount(amount)}
                >
                  Rp {amount.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
            
            <div className="topup-input-group">
              <label htmlFor="topupAmount" className="topup-label">Or enter custom amount:</label>
              <div className="topup-input-wrapper">
                <span className="topup-currency">Rp</span>
                <input
                  type="number"
                  id="topupAmount"
                  className="topup-input"
                  placeholder="Enter amount"
                  value={topupAmount}
                  onChange={(e) => {
                    setTopupAmount(e.target.value);
                    setTopupError('');
                  }}
                  min="10000"
                  max="10000000"
                />
              </div>
              <p className="topup-hint">Min: Rp 10.000 | Max: Rp 10.000.000</p>
            </div>
            
            {topupError && (
              <div className="topup-error">{topupError}</div>
            )}
            
            <div className="modal-actions">
              <button 
                type="button" 
                className="modal-btn modal-btn-secondary" 
                onClick={closeTopupModal}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="modal-btn modal-btn-primary"
                disabled={topupLoading || !topupAmount}
              >
                {topupLoading ? 'Processing...' : 'Top Up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
