import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import Register from './Register';

export default function Header() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const closeModals = () => {
    setShowLogin(false);
    setShowRegister(false);
  };

  const switchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const switchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  return (
    <header className="header">
      <div className="logo">
        <h1>Blurb</h1>
        <span className="tagline">Daily Typing Challenge</span>
      </div>

      <nav className="nav">
        {user ? (
          <div className="user-info">
            <span className="username">{user.username}</span>
            <button className="btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn-secondary" onClick={() => setShowLogin(true)}>
              Login
            </button>
            <button className="btn-primary" onClick={() => setShowRegister(true)}>
              Register
            </button>
          </div>
        )}
      </nav>

      {showLogin && (
        <Login onClose={closeModals} switchToRegister={switchToRegister} />
      )}
      {showRegister && (
        <Register onClose={closeModals} switchToLogin={switchToLogin} />
      )}
    </header>
  );
}
