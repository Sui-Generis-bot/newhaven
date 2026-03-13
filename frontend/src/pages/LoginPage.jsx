// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields]   = useState({ username: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => { setFields(p => ({ ...p, [f]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.username.trim() || !fields.password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(fields.username.trim(), fields.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        {/* Branding strip */}
        <div className="login-brand">
          <div className="login-logo" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="white" fillOpacity="0.18"/>
              <path d="M7 8h14M7 14h9M7 20h11" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>Company Directory</h1>
          <p>Internal Staff Contact Portal</p>
        </div>

        {/* Form */}
        <div className="login-form-wrap">
          <h2>Sign in to your account</h2>

          {error && (
            <div className="login-error" role="alert">
              <span aria-hidden="true">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                className="form-input"
                type="text"
                value={fields.username}
                onChange={set('username')}
                autoComplete="username"
                autoFocus
                placeholder="Enter your username"
                maxLength={64}
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ marginTop: 'var(--sp-5)' }}>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="form-input"
                type="password"
                value={fields.password}
                onChange={set('password')}
                autoComplete="current-password"
                placeholder="Enter your password"
                maxLength={128}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--sp-8)' }}
              disabled={loading}
            >
              {loading ? <><span className="login-spinner" aria-hidden="true" />Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p className="login-note">
            Access is restricted to authorized personnel. Contact your administrator if you need access.
          </p>
        </div>
      </div>

      <style>{`
        .login-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 50%, #b52226 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--sp-6);
        }
        .login-card {
          background: var(--color-bg);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-width: 420px;
          overflow: hidden;
        }
        .login-brand {
          background: var(--color-primary);
          padding: var(--sp-8) var(--sp-8) var(--sp-10);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--sp-3);
          clip-path: ellipse(100% 88% at 50% 0%);
          padding-bottom: var(--sp-12);
        }
        .login-brand h1 {
          font-family: var(--font-heading);
          font-size: var(--text-lg);
          color: #fff;
          letter-spacing: -0.01em;
        }
        .login-brand p { color: rgba(255,255,255,0.72); font-size: var(--text-sm); }
        .login-form-wrap {
          padding: var(--sp-8);
          margin-top: calc(-1 * var(--sp-4));
        }
        .login-form-wrap h2 {
          font-family: var(--font-heading);
          font-size: var(--text-md);
          color: var(--color-text);
          margin-bottom: var(--sp-6);
          text-align: center;
        }
        .login-error {
          background: rgba(192,57,43,0.09);
          border: 1px solid var(--color-error);
          border-left: 4px solid var(--color-error);
          color: var(--color-error);
          padding: var(--sp-3) var(--sp-4);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          margin-bottom: var(--sp-5);
          display: flex;
          gap: var(--sp-2);
          align-items: center;
        }
        .login-note {
          margin-top: var(--sp-6);
          font-size: var(--text-xs);
          color: var(--color-text-light);
          text-align: center;
          line-height: var(--leading-loose);
        }
        .login-spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: var(--sp-2);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
