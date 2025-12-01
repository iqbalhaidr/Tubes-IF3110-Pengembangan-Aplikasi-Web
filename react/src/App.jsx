import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuctionList from './pages/AuctionList';
import AuctionDetail from './pages/AuctionDetail';
import './App.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [user, setUser] = useState(null);

  useEffect(() => {
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
        // Allow guest access even if auth check fails
        setIsAuthenticated(false);
        localStorage.removeItem('user');
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/logout', {
        credentials: 'include'
      });
      setUser(null);
      setIsAuthenticated(false);
      // Redirect to PHP login after logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/login';
    }
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return <div className="app-loading">Loading...</div>;
  }

  // Allow both authenticated and guest users to access the app
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-container">
            <div className="logo-section">
              <h1>🔨 Nimonspedia Auctions</h1>
              <p className="tagline">Real-time Auction Platform</p>
            </div>
            <nav className="app-nav">
              {isAuthenticated && user ? (
                <div className="nav-links">
                  <a href="/home" className="nav-link">
                    🏪 Back to Store
                  </a>
                  <div className="auth-section">
                    <span className="user-name">{user?.name || user?.email || 'User'}</span>
                    <button
                      onClick={handleLogout}
                      className="btn btn-secondary btn-sm"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="auth-section">
                  <a href="/login" className="btn btn-primary btn-sm">Login to Bid</a>
                  <a href="/home" className="nav-link">🏪 Back to Store</a>
                </div>
              )}
            </nav>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/auctions" element={<AuctionList />} />
            <Route path="/auction/:id" element={<AuctionDetail />} />
            {/* Future routes for Milestone 2 */}
            {/* <Route path="/chat" element={<Chat />} /> */}
            {/* <Route path="/admin" element={<AdminDashboard />} /> */}
            {/* Redirect any unmatched routes back to PHP home */}
            <Route path="*" element={<Navigate to="/auctions" replace />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <p>&copy; 2024 Nimonspedia - Milestone 2 Auction System</p>
            <p className="tech-stack">
              Built with React 18 | Socket.io | Node.js Express
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
