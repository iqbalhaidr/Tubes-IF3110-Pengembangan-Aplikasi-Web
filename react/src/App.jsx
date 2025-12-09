import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuctionList from './pages/AuctionList';
import AuctionDetail from './pages/AuctionDetail';
import SellerAuctionList from './pages/SellerAuctionList';
import CreateAuction from './pages/CreateAuction';
import SellerAuctionManage from './pages/SellerAuctionManage';
import ChatPage from './pages/ChatPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard'
import FeatureGate, { FEATURES } from './components/admin/FeatureGate';
import Navbar from './components/Navbar';
import './App.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Register service worker for push notifications
    // Note: Service worker registration is optional and only attempted if sw.js exists
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        }).catch((error) => {
          console.debug('Service Worker not available (this is optional):', error.message);
        });
    }

    // Check if user is logged in via PHP session
    const checkAuth = async () => {
      try {
        // Make a request to /auth/me which checks session and returns user data
        const response = await fetch('/auth/me', {
          method: 'GET',
          credentials: 'include', // Include cookies (PHP session)
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // PHP Response::success returns { success: true, message: "...", data: {...} }
          if (data.success && data.data) {
            setUser(data.data);
            localStorage.setItem('user', JSON.stringify(data.data));
            setIsAuthenticated(true);
          } else {
            // Not authenticated - allow guest access to browse auctions
            setIsAuthenticated(false);
            localStorage.removeItem('user');
          }
        } else {
          // Server returned error - allow guest access
          setIsAuthenticated(false);
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthError(error.message);
        // Allow guest access even if auth check fails
        setIsAuthenticated(false);
        localStorage.removeItem('user');
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', {
        credentials: 'include'
      });
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      // Redirect to PHP login after logout
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/auth/login';
    }
  };

  const handleBalanceUpdate = (newBalance) => {
    // Update user state with new balance
    setUser(prevUser => ({
      ...prevUser,
      balance: newBalance
    }));
    // Also update localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    storedUser.balance = newBalance;
    localStorage.setItem('user', JSON.stringify(storedUser));
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading Auction Platform...</p>
      </div>
    );
  }

  // Allow both authenticated and guest users to access the app
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="/*" element={
        <div className="app">
          {/* Use shared Navbar component matching PHP styling */}
          <Navbar key={user?.user_id || 'guest'} user={user} onLogout={handleLogout} onBalanceUpdate={handleBalanceUpdate} />

          <main className="app-main">
                  
                  <Routes>
                    {/* Buyer auction views - accessible by all */}
                    <Route path="/auctions" element={
                      <FeatureGate feature={FEATURES.AUCTION_ENABLED}>
                        <AuctionList />
                      </FeatureGate>
                    } />

                    <Route path="/auction/:id" element={
                      <FeatureGate feature={FEATURES.AUCTION_ENABLED}>
                        <AuctionDetail />
                      </FeatureGate>
                    } />
                    
                    {/* Seller auction routes - protected for sellers only */}
                    <Route 
                      path="/manage-auctions" 
                      element={
                        <FeatureGate feature={FEATURES.AUCTION_ENABLED}>
                          {
                            user && user.role === 'SELLER' 
                            ? <SellerAuctionList /> 
                            : <Navigate to="/auctions" replace />
                          }
                        </FeatureGate>
                      } 
                    />
                    <Route 
                      path="/manage-auctions/create" 
                      element={
                        <FeatureGate feature={FEATURES.AUCTION_ENABLED}>
                          {
                            user && user.role === 'SELLER' 
                            ? <CreateAuction /> 
                            : <Navigate to="/auctions" replace />
                          }
                        </FeatureGate>
                      } 
                    />
                    <Route 
                      path="/manage-auctions/:id" 
                      element={
                        <FeatureGate feature={FEATURES.AUCTION_ENABLED}>
                          {
                          user && user.role === 'SELLER' 
                            ? <SellerAuctionManage /> 
                            : <Navigate to="/auctions" replace />
                          }
                        </FeatureGate>
                      } 
                    />
                    
                    {/* Chat route - requires authentication */}
                    <Route 
                      path="/chat" 
                      element={
                        <FeatureGate feature={FEATURES.CHAT_ENABLED}>
                          {
                            isAuthenticated 
                              ? <ChatPage /> 
                              : <Navigate to="/auth/login" replace />
                          }
                        </FeatureGate>
                      } 
                    />
                    
                    {/* Future routes for Milestone 2 */}
                    {/* <Route path="/admin" element={<AdminDashboard />} /> */}
                    
                    {/* Redirect any unmatched routes back to auctions */}
                    <Route path="*" element={<Navigate to="/auctions" replace />} />
                  </Routes>
                </main>
{/* 
          <footer className="app-footer">
            <div className="footer-content">
              <p>&copy; 2025 Nimonspedia - Auction Platform</p>
              <p className="tech-stack">
                Built with React 18 | Socket.io | Node.js Express
              </p>
            </div>
          </footer> */}
        </div>
      } />
    </Routes>
  );
}
