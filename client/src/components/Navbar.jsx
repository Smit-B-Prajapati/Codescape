import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Globe, Map, PlusCircle, User, Server, LogOut, LogIn, UserPlus, Shield, Sun, Moon, Sparkles } from 'lucide-react';

export default function Navbar({ apiStatus }) {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const status = apiStatus || { loading: false, online: true };

  const navLinks = [
    { name: 'Home', path: '/', icon: Globe },
    { name: 'AI Trip Agent', path: '/ai-agent', icon: Sparkles },
    { name: 'My Trips', path: '/trips', icon: Map },
    { name: 'Manual Planning', path: '/plan', icon: PlusCircle },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Admin Control', path: '/admin', icon: Shield },
  ];

  return (
    <header className="glass-card" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '1rem 0' }}>
      <div className="container flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <Globe className="pulse-glow" style={{ color: '#3b82f6', width: 28, height: 28 }} />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)' }}>
            Globe<span className="gradient-text">Trotter</span>
          </span>
        </Link>

        {/* Navigation Structure */}
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className="flex items-center gap-2"
                style={{
                  color: isActive ? '#60a5fa' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.95rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <Icon style={{ width: 16, height: 16 }} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Authentication Controls, Theme Toggle & Status Badge */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: '0.45rem', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? (
              <Sun style={{ width: 18, height: 18, color: '#f59e0b' }} />
            ) : (
              <Moon style={{ width: 18, height: 18, color: '#2563eb' }} />
            )}
          </button>

          <div className={`badge ${status.online ? 'badge-success' : 'badge-info'}`}>
            <Server style={{ width: 14, height: 14 }} />
            {status.loading ? 'Connecting...' : status.online ? 'API Online' : 'API Offline'}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2" style={{ background: 'var(--btn-secondary-bg)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-glass)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name?.split(' ')[0]}</span>
              </div>
              
              <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }} title="Log out">
                <LogOut style={{ width: 14, height: 14 }} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 0.95rem', fontSize: '0.85rem' }}>
                <LogIn style={{ width: 14, height: 14 }} />
                <span>Sign In</span>
              </Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.5rem 0.95rem', fontSize: '0.85rem' }}>
                <UserPlus style={{ width: 14, height: 14 }} />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
