import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTripByIdApi, updateTripApi } from '../services/api';
import Navbar from '../components/Navbar';
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
              <span>Back</span>
            </button>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Edit Trip Details</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Update travel dates, trip name, notes, or cover banner.
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Compass className="pulse-glow" style={{ width: 40, height: 40, color: '#3b82f6', margin: '0 auto 1rem auto' }} />
              <p style={{ fontFamily: 'var(--font-heading)' }}>Loading trip data...</p>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '2.5rem' }}>
              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
                  <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Trip Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Trip Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.8rem 1rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}
                    required
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Start Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-dimmed)' }} />
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      End Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-dimmed)' }} />
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Cover Photo */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Cover Image URL
                  </label>
                  <div style={{ position: 'relative' }}>
                    <ImageIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-dimmed)' }} />
                    <input
                      type="url"
                      name="coverPhoto"
                      value={formData.coverPhoto}
                      onChange={handleChange}
                      placeholder="https://images.unsplash.com/photo-..."
                      style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Trip Notes / Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    style={{ width: '100%', padding: '0.8rem 1rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                {/* Public Sharing Toggle */}
                <div className="flex items-center gap-3" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    style={{ width: 18, height: 18, accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                  <label htmlFor="isPublic" style={{ fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    Allow this trip to be shared publicly with other travelers
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
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
                    style={{ padding: '0.85rem 1.5rem' }}
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
    </div>
  );
}
