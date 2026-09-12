import React, { useState, useEffect } from 'react';
import { getAdminAnalyticsApi, updateUserRoleApi } from '../services/api';
import Navbar from '../components/Navbar';
import {
  Shield,
  Users,
  Compass,
  Globe,
  Tag,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Lock,
  UserCheck,
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAdminAnalyticsApi();
      if (response.success) {
        setData(response);
      }
    } catch (err) {
      console.error('[AdminDashboard fetch error]:', err);
      setError(err.message || 'Failed to load administrator analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  // Toggle Role (user <-> admin)
  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await updateUserRoleApi(targetUser._id, newRole);
      if (res.success) {
        showFeedback(`User ${targetUser.name} role updated to ${newRole.toUpperCase()}`);
        fetchAnalytics();
      }
    } catch (err) {
      console.error('[Update user role error]:', err);
      alert(err.message || 'Failed to update user role');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container">

          {/* Header Banner */}
          <div className="flex items-center gap-3" style={{ marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(37, 99, 235, 0.2)', padding: '0.65rem', borderRadius: '12px', color: '#60a5fa' }}>
              <Shield style={{ width: 28, height: 28 }} />
            </div>
            <div>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>Admin System Control Center</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                Platform metrics, destination aggregations, engagement trends, and user roster
              </p>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <CheckCircle2 style={{ width: 18, height: 18 }} />
              <span>{feedback}</span>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle style={{ width: 20, height: 20 }} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Compass className="pulse-glow" style={{ width: 44, height: 44, color: '#3b82f6', margin: '0 auto 1rem auto' }} />
              <p style={{ fontFamily: 'var(--font-heading)' }}>Loading system analytics...</p>
            </div>
          ) : data ? (
            <div>

              {/* 1. Statistic Metric Cards */}
              <div className="grid grid-cols-1 grid-cols-2 grid-cols-4 gap-4" style={{ marginBottom: '2.5rem' }}>
                
                {/* Total Users */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.15)', width: 50, height: 50, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users style={{ width: 24, height: 24, color: '#60a5fa' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Users</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.1rem' }}>{data.stats?.totalUsers || 0}</h3>
                  </div>
                </div>

                {/* Total Trips */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', width: 50, height: 50, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Compass style={{ width: 24, height: 24, color: '#34d399' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Trips</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.1rem' }}>{data.stats?.totalTrips || 0}</h3>
                  </div>
                </div>

                {/* Public Shared Trips */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(139, 92, 246, 0.15)', width: 50, height: 50, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe style={{ width: 24, height: 24, color: '#a78bfa' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Public Trips</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.1rem' }}>{data.stats?.totalPublicTrips || 0}</h3>
                  </div>
                </div>

                {/* Scheduled Activities */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.15)', width: 50, height: 50, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag style={{ width: 24, height: 24, color: '#fbbf24' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Activities</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.1rem' }}>{data.stats?.totalActivities || 0}</h3>
                  </div>
                </div>

              </div>

              {/* 2. Popular Cities & Category Analytics */}
              <div className="grid grid-cols-1 grid-cols-2 gap-6" style={{ marginBottom: '2.5rem' }}>
                
                {/* Popular Cities Aggregation */}
                <div className="glass-card" style={{ padding: '1.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                    Popular Destination Stops
                  </h3>

                  {data.popularCities && data.popularCities.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {data.popularCities.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center" style={{ padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                          <div className="flex items-center gap-2">
                            <MapPin style={{ width: 14, height: 14, color: '#60a5fa' }} />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.city}, {item.country}</span>
                          </div>
                          <span className="badge badge-info">{item.count} Stops</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No stop analytics recorded yet.</p>
                  )}
                </div>

                {/* Popular Activity Categories */}
                <div className="glass-card" style={{ padding: '1.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                    Activity Category Distribution
                  </h3>

                  {data.popularCategories && data.popularCategories.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {data.popularCategories.map((cat, idx) => (
                        <div key={idx} className="flex justify-between items-center" style={{ padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="badge badge-success">{cat.count} Events</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(${cat.totalCost})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No category analytics recorded yet.</p>
                  )}
                </div>

              </div>

              {/* 3. User Management Roster */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Registered Travelers Roster</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage user roles and view account engagement</p>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>User Name</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Email</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Joined Date</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Total Trips</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.userRoster?.map((u) => (
                        <tr key={u._id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span className={`badge ${u.role === 'admin' ? 'badge-success' : 'badge-info'}`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{formatDate(u.createdAt)}</td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700 }}>{u.tripCount}</td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleToggleRole(u)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            >
                              <UserCheck style={{ width: 12, height: 12 }} />
                              <span>{u.role === 'admin' ? 'Demote' : 'Make Admin'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : null}

        </div>
      </main>
    </div>
  );
}
