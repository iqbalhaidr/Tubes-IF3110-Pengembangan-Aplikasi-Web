import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuctionList from './pages/AuctionList';
import AuctionDetail from './pages/AuctionDetail';
import './App.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-container">
            <div className="logo-section">
              <h1>🏠 Nimonspedia</h1>
              <p className="tagline">Real-time Auction Platform</p>
            </div>
            <nav className="app-nav">
              {isAuthenticated ? (
                <div className="auth-section">
                  <span className="user-name">{user?.username || 'User'}</span>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary btn-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="auth-section">
                  <p>Please log in to continue</p>
                </div>
              )}
            </nav>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<AuctionList />} />
            <Route path="/auctions" element={<AuctionList />} />
            <Route path="/auction/:id" element={<AuctionDetail />} />
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
