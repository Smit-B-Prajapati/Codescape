import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTripByIdApi, updateTripApi } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar, Image as ImageIcon, ArrowLeft, AlertCircle, Compass } from 'lucide-react';

export default function EditTrip() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    coverPhoto: '',
    isPublic: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrip = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getTripByIdApi(id);
        if (response.success && response.trip) {
          const t = response.trip;
          setFormData({
            name: t.name || '',
            description: t.description || '',
            startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
            endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '',
            coverPhoto: t.coverPhoto || '',
            isPublic: t.isPublic || false,
          });
        }
      } catch (err) {
        console.error('[EditTrip fetch error]:', err);
        setError(err.message || 'Failed to load trip details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTrip();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please provide a trip name');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Please select both start date and end date');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date cannot be before start date');
      return;
    }

    setSubmitting(true);
    try {
      const response = await updateTripApi(id, formData);
      if (response.success) {
        navigate(`/trips/${id}`);
      }
    } catch (err) {
      console.error('[EditTrip submit error]:', err);
      setError(err.message || 'Failed to update trip');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container" style={{ maxWidth: '780px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => navigate(`/trips/${id}`)}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
              <span>Back to Trip</span>
            </button>

            <h1 className="editorial-display" style={{ fontSize: '2.4rem', fontWeight: 800 }}>
              Edit Trip Details
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '1.02rem' }}>
              Update dates, title, cover imagery, and visibility for this itinerary.
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Compass className="pulse-glow" style={{ width: 40, height: 40, color: 'var(--primary)', margin: '0 auto 1rem auto' }} />
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600 }}>Loading trip settings...</p>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
              {error && (
                <div
                  style={{
                    background: 'rgba(225, 29, 72, 0.12)',
                    border: '1px solid rgba(225, 29, 72, 0.3)',
                    color: '#e11d48',
                    padding: '0.85rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Trip Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                    Trip Name <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.85rem 1.15rem' }}
                    required
                  />
                </div>

                {/* Start Date & End Date */}
                <div className="grid grid-cols-1 grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                      Start Date <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-dimmed)' }} />
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.85rem 1.15rem 0.85rem 2.6rem' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                      End Date <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-dimmed)' }} />
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.85rem 1.15rem 0.85rem 2.6rem' }}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Cover Photo URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                    Cover Image URL <span style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)' }}>(Optional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <ImageIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-dimmed)' }} />
                    <input
                      type="url"
                      name="coverPhoto"
                      value={formData.coverPhoto}
                      onChange={handleChange}
                      placeholder="https://images.unsplash.com/photo-..."
                      style={{ width: '100%', padding: '0.85rem 1.15rem 0.85rem 2.6rem' }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                    Trip Notes / Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    style={{ width: '100%', padding: '0.85rem 1.15rem' }}
                  />
                </div>

                {/* Public Sharing Toggle */}
                <div
                  className="flex items-center gap-3"
                  style={{
                    background: 'var(--surface-warm)',
                    padding: '0.95rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <label htmlFor="isPublic" style={{ fontSize: '0.92rem', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Allow this trip to be shared publicly with other travelers
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3" style={{ marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/trips/${id}`)}
                    className="btn btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '0.85rem 1.75rem', fontWeight: 700 }}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
