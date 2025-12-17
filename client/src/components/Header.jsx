import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Login from './Login';
import Register from './Register';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
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
        <h1>blurb</h1>
      </div>

      <nav className="nav">
        <button className="theme-toggle" onClick={toggle} title="Toggle theme">
          {theme === 'light' ? '●' : '○'}
        </button>

        {user ? (
          <div className="user-info">
            <span className="username">{user.username}</span>
            <button className="btn-secondary" onClick={logout}>
              logout
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn-secondary" onClick={() => setShowLogin(true)}>
              login
            </button>
            <button className="btn-primary" onClick={() => setShowRegister(true)}>
              register
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
