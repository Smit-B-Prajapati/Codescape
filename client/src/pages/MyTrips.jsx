import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTripsApi, deleteTripApi } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TripCard from '../components/TripCard';
import ConfirmModal from '../components/ConfirmModal';
import { Map, Plus, Search, Compass, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getTripsApi();
      if (response.success) {
        setTrips(response.trips || []);
        setFilteredTrips(response.trips || []);
      }
    } catch (err) {
      console.error('[MyTrips fetch error]:', err);
      setError(err.message || 'Failed to load your trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTrips(trips);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredTrips(
        trips.filter(
          (t) =>
            t.name.toLowerCase().includes(term) ||
            (t.description && t.description.toLowerCase().includes(term))
        )
      );
    }
  }, [searchTerm, trips]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await deleteTripApi(deleteTarget._id);
      if (response.success) {
        setTrips(trips.filter((t) => t._id !== deleteTarget._id));
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('[Delete trip error]:', err);
      alert(err.message || 'Failed to delete trip');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container">
          
          {/* Header */}
          <div
            className="flex flex-col flex-md-row justify-between items-center gap-4"
            style={{ marginBottom: '2.5rem' }}
          >
            <div>
              <div className="badge badge-lavender" style={{ marginBottom: '0.65rem' }}>
                <Map style={{ width: 14, height: 14 }} /> Personal Itineraries
              </div>
              <h1 className="editorial-display" style={{ fontSize: '2.4rem', fontWeight: 800 }}>
                My Travel Trips
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '1.02rem' }}>
                Manage all your upcoming, active, and completed travel itineraries in one place.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/ai-agent"
                className="btn btn-primary"
                style={{
                  padding: '0.85rem 1.6rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                <Sparkles style={{ width: 18, height: 18, color: '#FFE0B9' }} />
                <span>AI Trip Agent</span>
              </Link>
              <Link
                to="/plan"
                className="btn btn-secondary"
                style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 600 }}
              >
                <Plus style={{ width: 18, height: 18 }} />
                <span>Manual Planning</span>
              </Link>
            </div>
          </div>

          {/* Search Bar & Filters */}
          <div
            className="glass-card"
            style={{
              padding: '1rem 1.25rem',
              marginBottom: '2.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 18,
                  height: 18,
                  color: 'var(--text-dimmed)',
                }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search trips by destination, title, or keywords..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.8rem',
                  fontSize: '0.95rem',
                }}
              />
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dimmed)', whiteSpace: 'nowrap', fontWeight: 600 }}>
              Showing {filteredTrips.length} of {trips.length} journeys
            </span>
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
                onClick={fetchTrips}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} /> Retry
              </button>
            </div>
          )}

          {/* Loading State */}
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
                Loading your travel portfolio...
              </p>
            </div>
          ) : filteredTrips.length > 0 ? (
            /* Trips Grid */
            <div className="grid grid-cols-1 grid-cols-2 grid-cols-3 gap-6">
              {filteredTrips.map((trip) => (
                <TripCard key={trip._id} trip={trip} onDeleteRequest={setDeleteTarget} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div
              className="glass-card"
              style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                maxWidth: '600px',
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
                <Map style={{ width: 32, height: 32, color: 'var(--primary)' }} />
              </div>
              <h3 style={{ fontSize: '1.45rem', marginBottom: '0.65rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {searchTerm ? 'No matching journeys found' : 'No trips planned yet'}
              </h3>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                {searchTerm
                  ? `No journeys match "${searchTerm}". Try checking your spelling or clear the filter.`
                  : 'Start planning your next getaway with autonomous AI assistance or custom day-by-day mapping.'}
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="btn btn-secondary" style={{ padding: '0.85rem 1.5rem' }}>
                    Clear Filter
                  </button>
                )}
                <Link to="/ai-agent" className="btn btn-primary" style={{ padding: '0.85rem 1.6rem' }}>
                  <Sparkles style={{ width: 18, height: 18, color: '#FFE0B9' }} />
                  <span>Plan with AI Agent</span>
                </Link>
                <Link to="/plan" className="btn btn-secondary" style={{ padding: '0.85rem 1.5rem' }}>
                  <Plus style={{ width: 18, height: 18 }} />
                  <span>Manual Planning</span>
                </Link>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteTarget && (
            <ConfirmModal
              isOpen={Boolean(deleteTarget)}
              title="Delete Travel Trip"
              message={`Are you sure you want to permanently delete "${deleteTarget.name}"? All associated itinerary stops and expenses will be removed.`}
              confirmText={deleting ? 'Deleting...' : 'Delete Trip'}
              confirmVariant="danger"
              onConfirm={handleDeleteConfirm}
              onCancel={() => setDeleteTarget(null)}
            />
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
