import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTripsApi, deleteTripApi } from '../services/api';
import Navbar from '../components/Navbar';
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container">
          
          {/* Header */}
          <div className="flex flex-col flex-md-row justify-between items-center gap-4" style={{ marginBottom: '2.5rem' }}>
            <div>
              <div className="badge badge-info" style={{ marginBottom: '0.5rem' }}>
                <Map style={{ width: 14, height: 14 }} /> Personal Itineraries
              </div>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>My Travel Trips</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Manage all your upcoming and past travel itineraries.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/ai-agent"
                className="btn btn-primary"
                style={{
                  padding: '0.85rem 1.5rem',
                  fontSize: '1.02rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #2563eb 100%)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                }}
              >
                <Sparkles style={{ width: 18, height: 18 }} />
                <span>AI Trip Agent</span>
              </Link>
              <Link
                to="/plan"
                className="btn btn-secondary"
                style={{ padding: '0.85rem 1.5rem', fontSize: '1.02rem' }}
              >
                <Plus style={{ width: 18, height: 18 }} />
                <span>Manual Planning</span>
              </Link>
            </div>
          </div>

          {/* Search Bar & Filters */}
          <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', itemsCenter: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-dimmed)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search trips by title or keywords..."
                style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.6rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Showing {filteredTrips.length} of {trips.length} trips
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="flex items-center gap-2">
                <AlertCircle style={{ width: 20, height: 20 }} />
                <span>{error}</span>
              </div>
              <button onClick={fetchTrips} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                <RefreshCw style={{ width: 14, height: 14 }} /> Retry
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Compass className="pulse-glow" style={{ width: 40, height: 40, color: '#3b82f6', margin: '0 auto 1rem auto' }} />
              <p style={{ fontFamily: 'var(--font-heading)' }}>Retrieving your trips...</p>
            </div>
          ) : filteredTrips.length > 0 ? (
            <div className="grid grid-cols-1 grid-cols-2 grid-cols-3 gap-6">
              {filteredTrips.map((trip) => (
                <TripCard
                  key={trip._id}
                  trip={trip}
                  onDeleteRequest={(t) => setDeleteTarget(t)}
                />
              ))}
            </div>
          ) : (
            /* Specified Empty State */
            <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.12)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <Map style={{ width: 32, height: 32, color: '#60a5fa' }} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                You haven't planned any trips yet.
              </h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Start planning your next adventure.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  to="/ai-agent"
                  className="btn btn-primary"
                  style={{
                    padding: '0.85rem 1.5rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #2563eb 100%)',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  <Sparkles style={{ width: 18, height: 18 }} />
                  <span>Plan with AI</span>
                </Link>
                <Link
                  to="/plan"
                  className="btn btn-secondary"
                  style={{ padding: '0.85rem 1.5rem' }}
                >
                  <Plus style={{ width: 18, height: 18 }} />
                  <span>Manual Planning</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Trip"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will remove all associated stops, activities, and budget records.`}
        confirmText="Delete Trip"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
