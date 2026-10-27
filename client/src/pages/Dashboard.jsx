import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardApi } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TripCard from '../components/TripCard';
import DestinationCard from '../components/DestinationCard';
import BudgetHighlightCard from '../components/BudgetHighlightCard';
import { Plus, Compass, MapPin, AlertCircle, RefreshCw, Sparkles, Calendar, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getDashboardApi();
      if (response.success) {
        setData(response);
      }
    } catch (err) {
      console.error('[Dashboard fetch error]:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const [activeFilter, setActiveFilter] = useState('all');

  const handleSelectFilter = (filterType) => {
    if (filterType === 'expenses') {
      if (data?.recentTrips && data.recentTrips.length > 0) {
        navigate(`/trips/${data.recentTrips[0]._id}/budget`);
      } else {
        navigate('/plan');
      }
      return;
    }
    setActiveFilter(filterType);
  };

  const handlePlanTripClick = (destination) => {
    if (destination && destination.city) {
      navigate('/plan', { state: { initialName: `Trip to ${destination.city}, ${destination.country}` } });
    } else {
      navigate('/plan');
    }
  };

  const getFilteredTrips = () => {
    if (!data?.recentTrips) return [];
    if (activeFilter === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return data.recentTrips.filter((t) => {
        const end = t.endDate ? new Date(t.endDate) : new Date(t.startDate);
        return end >= today;
      });
    }
    return data.recentTrips;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container">
          
          {/* Welcome & Quick Action Header */}
          <div
            className="flex flex-col flex-md-row items-center justify-between gap-4"
            style={{ marginBottom: '2.5rem' }}
          >
            <div>
              <div className="badge badge-lavender" style={{ marginBottom: '0.65rem' }}>
                <Compass style={{ width: 14, height: 14 }} /> Traveler Control Center
              </div>
              <h1 className="editorial-display" style={{ fontSize: '2.4rem', fontWeight: 800 }}>
                Welcome back, <span className="gradient-text">{user?.name || 'Traveler'}</span>!
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '1.02rem' }}>
                Here is an overview of your upcoming journeys, budget analytics, and curated destination ideas.
              </p>
            </div>

            {/* Action Buttons: AI Trip Agent & Manual Planning */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/ai-agent')}
                className="btn btn-primary"
                style={{
                  padding: '0.85rem 1.6rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                <Sparkles style={{ width: 18, height: 18, color: '#FFE0B9' }} />
                <span>AI Trip Agent</span>
              </button>

              <button
                type="button"
                onClick={handlePlanTripClick}
                className="btn btn-secondary"
                style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 600 }}
              >
                <Plus style={{ width: 18, height: 18 }} />
                <span>Manual Planning</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                background: 'rgba(225, 29, 72, 0.12)',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                color: '#e11d48',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle style={{ width: 20, height: 20 }} />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchDashboard}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} /> Retry
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading ? (
            <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(69, 87, 153, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                }}
              >
                <Compass className="pulse-glow" style={{ width: 28, height: 28, color: 'var(--primary)' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600 }}>
                Loading your personalized dashboard...
              </p>
            </div>
          ) : (
            <>
              {/* Budget Highlights */}
              <BudgetHighlightCard
                stats={data?.stats}
                activeFilter={activeFilter}
                onSelectFilter={handleSelectFilter}
              />

              {/* Recent / Upcoming Trips Section */}
              <section style={{ marginBottom: '3.5rem' }}>
                <div
                  className="flex justify-between items-center"
                  style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 style={{ fontSize: '1.65rem', fontWeight: 800 }}>
                        {activeFilter === 'upcoming' ? 'Upcoming Journeys' : 'Your Travel Trips'}
                      </h2>
                      {activeFilter === 'upcoming' && (
                        <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                          Filtered ({getFilteredTrips().length})
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                      {activeFilter === 'upcoming'
                        ? 'Showing active and future travel itineraries'
                        : 'Trips created and managed by you'}
                    </p>
                  </div>

                  {activeFilter === 'upcoming' && (
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
                    >
                      Show All Trips
                    </button>
                  )}
                </div>

                {getFilteredTrips().length > 0 ? (
                  <div className="grid grid-cols-1 grid-cols-2 grid-cols-3 gap-6">
                    {getFilteredTrips().map((trip) => (
                      <TripCard key={trip._id} trip={trip} />
                    ))}
                  </div>
                ) : (
                  /* Specified Empty State */
                  <div
                    className="glass-card"
                    style={{
                      padding: '3.5rem 2rem',
                      textAlign: 'center',
                      maxWidth: '620px',
                      margin: '0 auto',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(69, 87, 153, 0.12)',
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                      }}
                    >
                      <MapPin style={{ width: 32, height: 32, color: 'var(--primary)' }} />
                    </div>
                    <h3 style={{ fontSize: '1.45rem', marginBottom: '0.65rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {activeFilter === 'upcoming'
                        ? 'No upcoming journeys found'
                        : "You haven't planned any trips yet."}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.98rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '2rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {activeFilter === 'upcoming'
                        ? 'Plan your next journey with our AI agent or create a custom manual itinerary.'
                        : 'Start planning your next adventure today.'}
                    </p>
                    <div className="flex justify-center gap-3 flex-wrap">
                      {activeFilter === 'upcoming' && (
                        <button
                          onClick={() => setActiveFilter('all')}
                          className="btn btn-secondary"
                          style={{ padding: '0.85rem 1.5rem' }}
                        >
                          View All Trips
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/ai-agent')}
                        className="btn btn-primary"
                        style={{ padding: '0.85rem 1.6rem' }}
                      >
                        <Sparkles style={{ width: 18, height: 18, color: '#FFE0B9' }} />
                        <span>Plan with AI Agent</span>
                      </button>
                      <button
                        onClick={handlePlanTripClick}
                        className="btn btn-secondary"
                        style={{ padding: '0.85rem 1.5rem' }}
                      >
                        <Plus style={{ width: 18, height: 18 }} />
                        <span>Manual Planning</span>
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Recommended Destinations (Curated Discovery) */}
              <section>
                <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                  <div>
                    <div className="badge badge-info" style={{ marginBottom: '0.35rem' }}>
                      Curated Recommendations
                    </div>
                    <h2 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Recommended Destinations</h2>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                      Explore trending destinations to inspire your next itinerary
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 grid-cols-2 grid-cols-4 gap-6">
                  {data?.recommendedDestinations?.map((dest) => (
                    <DestinationCard key={dest.id} destination={dest} onPlanTrip={handlePlanTripClick} />
                  ))}
                </div>
              </section>
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
