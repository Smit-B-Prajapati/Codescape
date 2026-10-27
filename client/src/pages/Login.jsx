import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Mail, Lock, LogIn, AlertCircle, Compass, ArrowRight } from 'lucide-react';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('globetrotter_saved_email') || 'smit200610@gmail.com';
    const savedPass = localStorage.getItem('globetrotter_saved_password') || 'password123';
    if (savedEmail) {
      setFormData({ email: savedEmail, password: savedPass });
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.email || !formData.password) {
      setLocalError('Please enter both email address and password');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('globetrotter_saved_email', formData.email);
      localStorage.setItem('globetrotter_saved_password', formData.password);
    } else {
      localStorage.removeItem('globetrotter_saved_email');
      localStorage.removeItem('globetrotter_saved_password');
    }

    setSubmitting(true);
    const result = await login(formData);
    setSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setLocalError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}
      >
        {/* Left Side: Travel Editorial Card */}
        <div
          className="glass-card flex flex-col justify-between"
          style={{
            padding: '2.75rem',
            background: 'linear-gradient(135deg, rgba(69, 87, 153, 0.92) 0%, rgba(16, 24, 47, 0.96) 100%)',
            color: '#FEF5EE',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 40px -10px rgba(16, 24, 47, 0.5)',
          }}
        >
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Globe style={{ color: '#FFE0B9', width: 22, height: 22 }} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '1.6rem',
                  letterSpacing: '-0.02em',
                  color: '#FEF5EE',
                }}
              >
                Globe<span style={{ color: '#FFE0B9' }}>Trotter</span>
              </span>
            </div>

            <div
              className="badge"
              style={{
                marginBottom: '1.5rem',
                background: 'rgba(255, 224, 185, 0.2)',
                color: '#FFE0B9',
                border: '1px solid rgba(255, 224, 185, 0.35)',
              }}
            >
              <Compass style={{ width: 14, height: 14 }} /> Welcome Back Traveler
            </div>

            <h2
              className="editorial-display"
              style={{ fontSize: '2.4rem', marginBottom: '1rem', lineHeight: '1.15', color: '#FEF5EE' }}
            >
              Plan smarter. <br />
              <span style={{ color: '#FFE0B9', fontStyle: 'italic' }}>Travel better.</span>
            </h2>

            <p style={{ color: 'rgba(254, 245, 238, 0.85)', fontSize: '0.98rem', lineHeight: '1.65' }}>
              Sign in to access your multi-city itineraries, manage travel stops, track real-time budgets, and explore curated destination activities.
            </p>
          </div>

          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <p style={{ fontSize: '0.88rem', color: 'rgba(254, 245, 238, 0.7)', fontStyle: 'italic', margin: 0 }}>
              "Travel is the only thing you buy that makes you richer."
            </p>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="glass-card" style={{ padding: '2.75rem', borderRadius: 'var(--radius-lg)' }}>
          <div className="flex justify-between items-start" style={{ marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.35rem' }}>Account Sign In</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                Enter your credentials to access your trips
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ email: 'smit200610@gmail.com', password: 'password123' })}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', flexShrink: 0, fontWeight: 700 }}
              title="Click to pre-fill demo account credentials"
            >
              ⚡ Demo Login
            </button>
          </div>

          {localError && (
            <div
              style={{
                background: 'rgba(225, 29, 72, 0.12)',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                color: '#e11d48',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.9rem',
              }}
            >
              <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span>{localError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 18,
                    height: 18,
                    color: 'var(--text-dimmed)',
                  }}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem' }}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center" style={{ marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 18,
                    height: 18,
                    color: 'var(--text-dimmed)',
                  }}
                />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem' }}
                  required
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2" style={{ marginTop: '0.2rem' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Remember email & password on this device
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '0.65rem', width: '100%', padding: '0.88rem', fontWeight: 700 }}
              disabled={submitting}
            >
              {submitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn style={{ width: 18, height: 18 }} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Create an account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
