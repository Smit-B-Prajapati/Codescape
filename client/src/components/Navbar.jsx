import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Globe,
  Map,
  PlusCircle,
  User,
  Server,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  Sun,
  Moon,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar({ apiStatus }) {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const status = apiStatus || { loading: false, online: true };

  const navLinks = [
    { name: 'Home', path: '/', icon: Globe },
    { name: 'AI Trip Agent', path: '/ai-agent', icon: Sparkles, badge: 'AI' },
    { name: 'My Trips', path: '/trips', icon: Map },
    { name: 'Manual Planning', path: '/plan', icon: PlusCircle },
    { name: 'Profile', path: '/profile', icon: User },
    ...(user?.role === 'admin' ? [{ name: 'Admin Control', path: '/admin', icon: Shield }] : []),
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header
      className="glass-card"
      style={{
        borderRadius: 0,
        borderTop: 0,
        borderLeft: 0,
        borderRight: 0,
        padding: '0.85rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--border-glass)',
        backgroundColor: 'var(--bg-glass)',
      }}
    >
      <div className="container flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #455799 0%, #10182F 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(69, 87, 153, 0.35)',
            }}
          >
            <Globe style={{ color: '#FEF5EE', width: 22, height: 22 }} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.45rem',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Globe<span className="gradient-text">Trotter</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="flex items-center gap-1"
          style={{
            display: 'none',
          }}
          // We can use a media query class or responsive inline styling
          id="desktop-nav"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className="flex items-center gap-2"
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'rgba(69, 87, 153, 0.1)' : 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.92rem',
                  transition: 'var(--transition-fast)',
                }}
              >
                <Icon style={{ width: 15, height: 15, color: isActive ? 'var(--primary)' : 'var(--text-dimmed)' }} />
                <span>{link.name}</span>
                {link.badge && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, #E2A9CA 0%, #B295C9 100%)',
                      color: '#10182F',
                      fontWeight: 800,
                    }}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Controls: Theme Toggle, API Status, Auth */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{
              padding: 0,
              borderRadius: '50%',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={theme === 'dark' ? 'Switch to Warm Ivory Light Mode' : 'Switch to Indigo Black Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun style={{ width: 17, height: 17, color: '#FFE0B9' }} />
            ) : (
              <Moon style={{ width: 17, height: 17, color: '#455799' }} />
            )}
          </button>

          {/* API Health Status Badge */}
          <div
            className={`badge ${status.online ? 'badge-success' : 'badge-info'}`}
            style={{ display: 'none', alignItems: 'center' }}
            id="navbar-api-badge"
          >
            <Server style={{ width: 12, height: 12 }} />
            <span>{status.loading ? 'Connecting' : status.online ? 'Online' : 'Offline'}</span>
          </div>

          {/* User Auth Info or Actions */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2"
                style={{
                  background: 'var(--btn-secondary-bg)',
                  padding: '0.3rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--btn-secondary-border, var(--border-glass))',
                  boxShadow: 'var(--shadow-sm)',
                  textDecoration: 'none',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #455799 0%, #B295C9 100%)',
                    color: '#FEF5EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    maxWidth: 100,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.name?.split(' ')[0]}
                </span>
              </Link>

              <button
                onClick={logout}
                className="btn btn-secondary"
                style={{
                  padding: '0.42rem 0.85rem',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600,
                }}
                title="Log out"
              >
                <LogOut style={{ width: 14, height: 14 }} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.88rem' }}>
                <LogIn style={{ width: 14, height: 14 }} />
                <span>Sign In</span>
              </Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}>
                <UserPlus style={{ width: 14, height: 14 }} />
                <span>Sign Up</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="btn btn-secondary"
            id="mobile-nav-toggle"
            style={{
              padding: '0.45rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--border-glass)',
            backgroundColor: 'var(--bg-glass)',
            backdropFilter: 'blur(16px)',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3"
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                  backgroundColor: isActive ? 'rgba(69, 87, 153, 0.12)' : 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                <Icon style={{ width: 18, height: 18, color: isActive ? 'var(--primary)' : 'var(--text-dimmed)' }} />
                <span>{link.name}</span>
                {link.badge && (
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
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div
            style={{
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className={`badge ${status.online ? 'badge-success' : 'badge-info'}`}>
              <Server style={{ width: 12, height: 12 }} />
              <span>{status.loading ? 'Connecting...' : status.online ? 'Server Online' : 'Server Offline'}</span>
            </div>

            {isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <LogOut style={{ width: 14, height: 14 }} />
                <span>Log out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global CSS media helpers for navbar */}
      <style>{`
        @media (min-width: 960px) {
          #desktop-nav {
            display: flex !important;
          }
          #mobile-nav-toggle {
            display: none !important;
          }
          #navbar-api-badge {
            display: inline-flex !important;
          }
          .d-md-inline {
            display: inline !important;
          }
        }
      `}</style>
    </header>
  );
}
