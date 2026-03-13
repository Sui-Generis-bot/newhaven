// src/components/NavBar.jsx
import { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useToast } from '../utils/ToastContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    addToast('You have been signed out.', 'info');
  };

  return (
    <header className="navbar" role="banner">
      <div className="container navbar-inner">
        {/* Brand */}
        <div className="navbar-brand">
          <span className="navbar-logo" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="white" fillOpacity="0.15"/>
              <path d="M7 8h14M7 14h9M7 20h11" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="navbar-title">Company Directory</span>
        </div>

        {/* Desktop user area */}
        <nav className="navbar-actions" aria-label="User menu">
          <div className="navbar-user">
            <div className="navbar-avatar" aria-hidden="true">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="navbar-user-info">
              <span className="navbar-username">{user?.username}</span>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button className="btn btn-ghost navbar-logout" onClick={handleLogout} aria-label="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            <span className="btn-label">Sign out</span>
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <div className="navbar-mobile-user">
            <span>{user?.username}</span>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
            Sign out
          </button>
        </div>
      )}

      <style>{`
        .navbar {
          background: var(--color-primary);
          height: var(--nav-height);
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        .navbar-inner {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
        }
        .navbar-title {
          font-family: var(--font-heading);
          font-size: var(--text-md);
          font-weight: var(--weight-bold);
          color: #fff;
          letter-spacing: -0.01em;
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: var(--sp-5);
        }
        .navbar-user {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
        }
        .navbar-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.35);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-heading);
          font-weight: var(--weight-bold);
          font-size: var(--text-sm);
          color: #fff;
        }
        .navbar-user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          line-height: 1;
        }
        .navbar-username {
          font-family: var(--font-heading);
          font-size: var(--text-sm);
          font-weight: var(--weight-bold);
          color: #fff;
        }
        .navbar-logout {
          color: rgba(255,255,255,0.85);
          border-color: rgba(255,255,255,0.3);
          background: transparent;
          font-size: var(--text-xs);
        }
        .navbar-logout:hover:not(:disabled) {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.5);
          color: #fff;
        }
        .navbar-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          padding: var(--sp-2);
          cursor: pointer;
        }
        .navbar-hamburger span {
          display: block;
          width: 22px; height: 2px;
          background: #fff;
          border-radius: 2px;
          transition: opacity var(--transition);
        }
        .navbar-mobile-menu {
          background: var(--color-primary-dark);
          padding: var(--sp-4) var(--sp-6);
          display: flex;
          flex-direction: column;
          gap: var(--sp-4);
          border-top: 1px solid rgba(255,255,255,0.15);
        }
        .navbar-mobile-user {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          color: #fff;
          font-family: var(--font-heading);
          font-weight: var(--weight-bold);
        }
        @media (max-width: 640px) {
          .navbar { height: auto; min-height: var(--nav-height); }
          .navbar-inner { height: var(--nav-height); }
          .navbar-actions { display: none; }
          .navbar-hamburger { display: flex; }
          .navbar-title { font-size: var(--text-base); }
          .btn-label { display: none; }
        }
      `}</style>
    </header>
  );
}
