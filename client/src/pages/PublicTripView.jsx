import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPublicTripBySlugApi, copyPublicTripApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  Globe,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Copy,
  CheckCircle2,
  AlertCircle,
  Compass,
  ArrowRight,
  User,
  Share2,
  Tag,
} from 'lucide-react';

export default function PublicTripView() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const navigate = useNavigate();

  const fetchPublicTrip = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getPublicTripBySlugApi(slug);
      if (response.success) {
        setData(response);
      }
    } catch (err) {
      console.error('[PublicTripView fetch error]:', err);
      setError(err.message || 'This trip itinerary is private or does not exist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchPublicTrip();
  }, [slug]);

  // Handle Copy Link
  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  // Handle Copy Trip to Account
  const handleCopyTripToAccount = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/trip/public/${slug}`);
      return;
    }

    setCopying(true);
    try {
      const res = await copyPublicTripApi(slug);
      if (res.success && res.newTripId) {
        navigate(`/trips/${res.newTripId}`);
      }
    } catch (err) {
      console.error('[Copy Trip error]:', err);
      alert(err.message || 'Failed to copy trip to your account.');
    } finally {
      setCopying(false);
    }
  };

  const formatDateHeader = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const diffTime = Math.abs(new Date(end) - new Date(start));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;
  };

  const defaultCover = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container">

          {/* Copy Link Feedback Banner */}
          {linkCopied && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <CheckCircle2 style={{ width: 18, height: 18 }} />
              <span>Public itinerary share link copied to clipboard!</span>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center', margin: '3rem 0' }}>
              <AlertCircle style={{ width: 40, height: 40, margin: '0 auto 0.75rem auto', color: '#ef4444' }} />
              <h3 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '0.35rem' }}>Itinerary Not Accessible</h3>
              <p style={{ fontSize: '0.9rem', color: '#fca5a5', marginBottom: '1.25rem' }}>{error}</p>
              <Link to="/" className="btn btn-primary" style={{ padding: '0.55rem 1.1rem' }}>
                Explore GlobeTrotter
              </Link>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Compass className="pulse-glow" style={{ width: 44, height: 44, color: '#3b82f6', margin: '0 auto 1rem auto' }} />
              <p style={{ fontFamily: 'var(--font-heading)' }}>Loading shared itinerary...</p>
            </div>
          ) : data?.trip ? (
            <div>

              {/* Read-Only Public Banner Header */}
              <div className="glass-card" style={{ height: '320px', width: '100%', position: 'relative', overflow: 'hidden', marginBottom: '2rem' }}>
                <img
                  src={data.trip.coverPhoto || defaultCover}
                  alt={data.trip.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11, 15, 25, 0.95) 0%, rgba(11, 15, 25, 0.3) 60%, transparent 100%)' }} />

                <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem' }} className="flex flex-col flex-md-row justify-between items-start items-md-end gap-4">
                  <div>
                    <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
                      <span className="badge badge-success">
                        <Globe style={{ width: 12, height: 12 }} /> Public Itinerary
                      </span>
                      <span className="badge badge-info" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}>
                        {calculateDuration(data.trip.startDate, data.trip.endDate)}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Created by <strong style={{ color: '#ffffff' }}>{data.trip.ownerName}</strong>
                      </span>
                    </div>

                    <h1 style={{ fontSize: '2.6rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                      {data.trip.name}
                    </h1>
                  </div>

                  {/* Share & Copy Buttons */}
                  <div className="flex items-center gap-3">
                    <button onClick={handleCopyLink} className="btn btn-secondary" style={{ padding: '0.65rem 1.1rem' }}>
                      <Share2 style={{ width: 16, height: 16 }} />
                      <span>{linkCopied ? 'Link Copied!' : 'Copy Link'}</span>
                    </button>

                    <button
                      onClick={handleCopyTripToAccount}
                      disabled={copying}
                      className="btn btn-primary"
                      style={{ padding: '0.65rem 1.25rem', background: '#2563eb' }}
                    >
                      <Copy style={{ width: 16, height: 16 }} />
                      <span>{copying ? 'Copying Trip...' : 'Copy Trip to My Account'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi-City Journey Route */}
              {data.stops && data.stops.length > 0 && (
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    Multi-City Journey Route
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '1rem', fontWeight: 600 }}>
                    {data.stops.map((stop, idx) => (
                      <React.Fragment key={stop._id || idx}>
                        <span className="gradient-text">{stop.city}, {stop.country}</span>
                        {idx < data.stops.length - 1 && (
                          <ArrowRight style={{ width: 16, height: 16, color: '#60a5fa' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Day-by-Day Activities Read-only Timeline */}
              <div className="flex flex-col gap-6" style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Day-by-Day Itinerary Schedule</h2>

                {data.days && data.days.length > 0 ? (
                  data.days.map((day) => (
                    <div key={day.dayNumber} className="glass-card" style={{ padding: '1.75rem' }}>
                      <div className="flex justify-between items-center" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
                        <div>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa' }}>
                            DAY {day.dayNumber}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginLeft: '0.5rem' }}>
                            • {formatDateHeader(day.date)}
                          </span>
                          {day.stop && (
                            <div style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.2rem' }}>
                              📍 {day.stop.city}, {day.stop.country}
                            </div>
                          )}
                        </div>

                        {day.totalCost > 0 && (
                          <span className="badge badge-success">Est. ${day.totalCost}</span>
                        )}
                      </div>

                      {/* Activities */}
                      {day.activities && day.activities.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {day.activities.map((act) => (
                            <div key={act._id} className="glass-card" style={{ padding: '1rem 1.25rem', background: 'rgba(255, 255, 255, 0.03)' }}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                      {act.time}
                                    </span>
                                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{act.name}</h4>
                                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{act.category}</span>
                                  </div>

                                  {act.description && (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                                      {act.description}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-4" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                                    <span>Duration: {act.duration} mins</span>
                                    <span>Cost: ${act.cost || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-dimmed)', fontSize: '0.88rem', textAlign: 'center', padding: '1rem 0' }}>
                          No activities scheduled for Day {day.dayNumber}.
                        </div>
                      )}
                    </div>
                  ))
                ) : null}
              </div>

            </div>
          ) : null}

        </div>
      </main>
    </div>
  );
}
