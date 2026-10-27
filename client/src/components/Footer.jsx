import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  Sparkles,
  Map,
  PlusCircle,
  User,
  Shield,
  Heart,
  Mail,
  CheckCircle2,
  ArrowRight,
  Compass,
} from 'lucide-react';

export default function Footer() {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubscribed(true);
    setEmailInput('');
    setTimeout(() => setSubscribed(false), 4500);
  };

  return (
    <footer
      style={{
        backgroundColor: '#10182F',
        color: '#FEF5EE',
        borderTop: '1px solid rgba(178, 149, 201, 0.18)',
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {/* Subtle Atmospheric Top Glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #B295C9 30%, #455799 70%, transparent 100%)',
          opacity: 0.7,
        }}
      />

      <div className="container" style={{ padding: '4rem 1.5rem 2.5rem 1.5rem' }}>
        <div className="grid grid-cols-1 grid-cols-4 gap-8" style={{ marginBottom: '3.5rem' }}>
          
          {/* Brand Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #455799 0%, #10182F 100%)',
                  border: '1px solid rgba(226, 169, 202, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(69, 87, 153, 0.45)',
                }}
              >
                <Globe style={{ color: '#FFE0B9', width: 22, height: 22 }} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '1.45rem',
                  letterSpacing: '-0.02em',
                  color: '#FEF5EE',
                }}
              >
                Globe<span style={{ color: '#FFE0B9' }}>Trotter</span>
              </span>
            </Link>

            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', margin: 0 }}>
              The next-generation autonomous travel concierge. Intelligent route generation, real-time verified booking, and day-by-day deterministic planning.
            </p>

            <div className="flex items-center gap-2" style={{ color: '#FFE0B9', fontSize: '0.85rem' }}>
              <Compass style={{ width: 16, height: 16 }} />
              <span style={{ fontStyle: 'italic' }}>Curated Journeys. Intelligent Travel.</span>
            </div>
          </div>

          {/* Core Platform Links */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#FFE0B9',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}
            >
              Platform Navigation
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <Link
                  to="/"
                  style={{ color: '#e2e8f0', fontSize: '0.92rem', textDecoration: 'none', transition: 'var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFE0B9')}
                  onMouseLeave={(e) => (e.target.style.color = '#e2e8f0')}
                >
                  Home & Curated Discoveries
                </Link>
              </li>
              <li>
                <Link
                  to="/ai-agent"
                  style={{ color: '#e2e8f0', fontSize: '0.92rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', transition: 'var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFE0B9')}
                  onMouseLeave={(e) => (e.target.style.color = '#e2e8f0')}
                >
                  <span>AI Trip Concierge</span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, #E2A9CA 0%, #B295C9 100%)',
                      color: '#10182F',
                      fontWeight: 800,
                    }}
                  >
                    AI
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/trips"
                  style={{ color: '#e2e8f0', fontSize: '0.92rem', textDecoration: 'none', transition: 'var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFE0B9')}
                  onMouseLeave={(e) => (e.target.style.color = '#e2e8f0')}
                >
                  My Travel Trips
                </Link>
              </li>
              <li>
                <Link
                  to="/plan"
                  style={{ color: '#e2e8f0', fontSize: '0.92rem', textDecoration: 'none', transition: 'var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFE0B9')}
                  onMouseLeave={(e) => (e.target.style.color = '#e2e8f0')}
                >
                  Manual Itinerary Builder
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  style={{ color: '#e2e8f0', fontSize: '0.92rem', textDecoration: 'none', transition: 'var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFE0B9')}
                  onMouseLeave={(e) => (e.target.style.color = '#e2e8f0')}
                >
                  Profile & Preferences
                </Link>
              </li>
              {user?.role === 'admin' && (
                <li>
                  <Link
                    to="/admin"
                    style={{ color: '#E2A9CA', fontSize: '0.92rem', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Admin Control Panel
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Curated Travel Escapes */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#FFE0B9',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}
            >
              Curated Escapes
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <Link
                  to="/plan"
                  state={{ initialName: 'Alpine Escape to Interlaken, Switzerland' }}
                  style={{ color: '#cbd5e1', fontSize: '0.92rem', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFE0B9')}
                  onMouseLeave={(e) => (e.target.style.color = '#cbd5e1')}
                >
                  Interlaken & Lucerne, Switzerland
                </Link>
              </li>
              <li>
                <Link
                  to="/plan"
                  state={{ initialName: 'Cultural Journey to Kyoto & Tokyo, Japan' }}
                  style={{ color: '#cbd5e1', fontSize: '0.92rem', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFE0B9')}
                  onMouseLeave={(e) => (e.target.style.color = '#cbd5e1')}
                >
                  Kyoto & Tokyo, Japan
                </Link>
              </li>
              <li>
                <Link
                  to="/plan"
                  state={{ initialName: 'Coastal Romance in Santorini, Greece' }}
                  style={{ color: '#cbd5e1', fontSize: '0.92rem', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFE0B9')}
                  onMouseLeave={(e) => (e.target.style.color = '#cbd5e1')}
                >
                  Santorini & Cyclades, Greece
                </Link>
              </li>
              <li>
                <Link
                  to="/plan"
                  state={{ initialName: 'Tropical Relaxation in Bali, Indonesia' }}
                  style={{ color: '#cbd5e1', fontSize: '0.92rem', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFE0B9')}
                  onMouseLeave={(e) => (e.target.style.color = '#cbd5e1')}
                >
                  Ubud & Seminyak, Bali
                </Link>
              </li>
              <li>
                <Link
                  to="/plan"
                  state={{ initialName: 'Heritage Retreat in Jaipur & Udaipur, India' }}
                  style={{ color: '#cbd5e1', fontSize: '0.92rem', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFE0B9')}
                  onMouseLeave={(e) => (e.target.style.color = '#cbd5e1')}
                >
                  Jaipur & Udaipur, India
                </Link>
              </li>
            </ul>
          </div>

          {/* Travel Newsletter & Trust Guarantee */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#FFE0B9',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}
            >
              The Traveler Dispatch
            </h4>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.55', marginBottom: '1rem' }}>
              Subscribe for secret flight drops, curated seasonal itineraries, and early access to autonomous travel features.
            </p>

            {subscribed ? (
              <div
                style={{
                  background: 'rgba(13, 148, 136, 0.2)',
                  border: '1px solid rgba(13, 148, 136, 0.45)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#2dd4bf',
                  fontSize: '0.85rem',
                }}
              >
                <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>You're on the list. Safe travels!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FEF5EE',
                    fontSize: '0.88rem',
                  }}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '0.55rem 0.95rem',
                    fontSize: '0.85rem',
                    background: 'linear-gradient(135deg, #455799 0%, #B295C9 100%)',
                    border: 'none',
                    color: '#FEF5EE',
                  }}
                >
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </form>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div className="flex items-center gap-2" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                <CheckCircle2 style={{ width: 13, height: 13, color: '#FFE0B9' }} />
                <span>Deterministic Zero-Duplicate Routing</span>
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                <CheckCircle2 style={{ width: 13, height: 13, color: '#FFE0B9' }} />
                <span>Bank-Grade 128-bit Payment Simulation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Terms */}
        <div
          style={{
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.82rem',
            color: '#94a3b8',
          }}
        >
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} GlobeTrotter Travel Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Verified Booking Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
