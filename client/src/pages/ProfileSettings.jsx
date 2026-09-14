import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfileApi, updateProfileApi, deleteAccountApi, toggleSavedDestinationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import {
  User,
  Mail,
  Globe,
  Camera,
  Bookmark,
  Shield,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  Compass,
} from 'lucide-react';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Hindi'];

export default function ProfileSettings() {
  const { user: authUser, logout, checkAuthStatus } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    profilePhoto: '',
    language: 'English',
    savedDestinations: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  // Account Deletion States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmEmailInput, setConfirmEmailInput] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const navigate = useNavigate();

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getProfileApi();
      if (response.success && response.user) {
        setProfile({
          name: response.user.name || '',
          email: response.user.email || '',
          profilePhoto: response.user.profilePhoto || '',
          language: response.user.language || 'English',
          savedDestinations: response.user.savedDestinations || [],
        });
      }
    } catch (err) {
      console.error('[Profile fetch error]:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Email validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(profile.email)) {
      setError('Please provide a valid email address');
      setSubmitting(false);
      return;
    }

    try {
      const res = await updateProfileApi(profile);
      if (res.success) {
        setSaveFeedback('Profile and preferences saved successfully');
        setTimeout(() => setSaveFeedback(''), 3500);
        checkAuthStatus(); // Refresh Auth Context state
      }
    } catch (err) {
      console.error('[Update profile error]:', err);
      setError(err.message || 'Failed to save profile changes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSavedDestination = async (dest) => {
    try {
      const res = await toggleSavedDestinationApi({ city: dest.city, country: dest.country });
      if (res.success) {
        setProfile((prev) => ({
          ...prev,
          savedDestinations: res.savedDestinations || [],
        }));
        setSaveFeedback('Saved destination list updated');
        setTimeout(() => setSaveFeedback(''), 3000);
      }
    } catch (err) {
      console.error('[Remove saved dest error]:', err);
    }
  };

  // Delete Account Handler
  const handleDeleteAccountConfirm = async () => {
    if (confirmEmailInput.trim().toLowerCase() !== profile.email.toLowerCase()) {
      alert('Confirmation email does not match your account email.');
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await deleteAccountApi();
      if (res.success) {
        logout();
        navigate('/');
      }
    } catch (err) {
      console.error('[Delete account error]:', err);
      alert(err.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>

          {/* Page Title Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>Account & Profile Settings</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Manage your personal identity, language preferences, saved destinations, and privacy controls
            </p>
          </div>

          {/* Save Feedback Toast */}
          {saveFeedback && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <CheckCircle2 style={{ width: 18, height: 18 }} />
              <span>{saveFeedback}</span>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
              <AlertCircle style={{ width: 18, height: 18 }} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Compass className="pulse-glow" style={{ width: 44, height: 44, color: '#3b82f6', margin: '0 auto 1rem auto' }} />
              <p style={{ fontFamily: 'var(--font-heading)' }}>Loading profile preferences...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">

              {/* 1. PROFILE SECTION */}
              <section className="glass-card" style={{ padding: '2rem' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-glass)' }}>
                  <User style={{ width: 22, height: 22, color: '#3b82f6' }} />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Profile Details</h3>
                </div>

                {/* Avatar Preview */}
                <div className="flex items-center gap-4" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid #2563eb', flexShrink: 0 }}>
                    <img
                      src={profile.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                      alt={profile.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Profile Photo URL</label>
                    <input
                      type="text"
                      name="profilePhoto"
                      value={profile.profilePhoto}
                      onChange={handleChange}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '0.65rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Name & Email Fields */}
                <div className="grid grid-cols-1 grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* 2. PREFERENCES SECTION */}
              <section className="glass-card" style={{ padding: '2rem' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-glass)' }}>
                  <Globe style={{ width: 22, height: 22, color: '#10b981' }} />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Preferences</h3>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Language Preference</label>
                  <select
                    name="language"
                    value={profile.language}
                    onChange={handleChange}
                    style={{ width: '100%', maxWidth: '300px', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang} style={{ backgroundColor: '#111827', color: '#ffffff' }}>{lang}</option>
                    ))}
                  </select>
                </div>
              </section>

              {/* 3. SAVED DESTINATIONS SECTION */}
              <section className="glass-card" style={{ padding: '2rem' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-glass)' }}>
                  <Bookmark style={{ width: 22, height: 22, color: '#f59e0b', fill: '#f59e0b' }} />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Saved Destinations ({profile.savedDestinations.length})</h3>
                </div>

                {profile.savedDestinations.length > 0 ? (
                  <div className="grid grid-cols-1 grid-cols-2 gap-3">
                    {profile.savedDestinations.map((dest, idx) => (
                      <div key={idx} className="glass-card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)' }}>
                        <div className="flex items-center gap-3">
                          <img
                            src={dest.image || 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80'}
                            alt={dest.city}
                            style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                          />
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dest.city}</h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{dest.country}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate('/plan')}
                            className="btn btn-primary"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            Plan Trip
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSavedDestination(dest)}
                            className="btn"
                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                            title="Remove from Saved Destinations"
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    No saved destinations yet. Discover and bookmark cities from the City Search tab on any trip or dashboard!
                  </p>
                )}
              </section>

              {/* 4. PRIVACY SECTION */}
              <section className="glass-card" style={{ padding: '2rem' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-glass)' }}>
                  <Shield style={{ width: 22, height: 22, color: '#8b5cf6' }} />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Privacy & Data</h3>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  GlobeTrotter ensures your password is strictly encrypted using bcrypt hashing. By default, your travel itineraries are private unless you explicitly choose to share them publicly.
                </p>
              </section>

              {/* SAVE CHANGES BUTTON */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
                >
                  <Save style={{ width: 18, height: 18 }} />
                  <span>{submitting ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>

              {/* 5. DANGER ZONE */}
              <section className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.04)' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '1rem', color: '#fca5a5' }}>
                  <AlertTriangle style={{ width: 22, height: 22 }} />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff' }}>Danger Zone</h3>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#fca5a5', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Deleting your account is permanent. All your planned trips, multi-city stops, activities, and budget history will be wiped immediately.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmEmailInput('');
                    setIsDeleteModalOpen(true);
                  }}
                  className="btn"
                  style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '0.65rem 1.25rem' }}
                >
                  <Trash2 style={{ width: 16, height: 16 }} />
                  <span>Delete Account Permanently</span>
                </button>
              </section>

            </form>
          )}

        </div>
      </main>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2rem', background: '#111827', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.75rem' }}>
              Confirm Account Deletion
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              To confirm permanent deletion, please type your email address <strong style={{ color: '#ffffff' }}>{profile.email}</strong> below:
            </p>

            <input
              type="email"
              value={confirmEmailInput}
              onChange={(e) => setConfirmEmailInput(e.target.value)}
              placeholder="Type your email to confirm..."
              style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', marginBottom: '1.5rem' }}
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary" disabled={deletingAccount} style={{ padding: '0.6rem 1rem' }}>
                Cancel
              </button>

              <button
                onClick={handleDeleteAccountConfirm}
                disabled={deletingAccount || confirmEmailInput.trim().toLowerCase() !== profile.email.toLowerCase()}
                className="btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: '#ffffff',
                  padding: '0.6rem 1.25rem',
                  opacity: confirmEmailInput.trim().toLowerCase() === profile.email.toLowerCase() ? 1 : 0.4,
                }}
              >
                {deletingAccount ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
