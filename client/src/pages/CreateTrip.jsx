import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createTripApi } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PlusCircle, Calendar, Image as ImageIcon, FileText, ArrowLeft, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export default function CreateTrip() {
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: location.state?.initialName || '',
    description: '',
    startDate: '',
    endDate: '',
    coverPhoto: '',
    isPublic: false,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      const response = await createTripApi(formData);
      if (response.success && response.trip) {
        navigate(`/trips/${response.trip._id}`);
      }
    } catch (err) {
      console.error('[Create Trip submit error]:', err);
      setError(err.message || 'Failed to create trip. Please try again.');
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
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
              <span>Back</span>
            </button>

            <h1 className="editorial-display" style={{ fontSize: '2.4rem', fontWeight: 800 }}>
              Plan a New Journey
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '1.02rem' }}>
              Define your travel dates, trip name, and destination cover banner to start building your custom itinerary.
            </p>
          </div>

          {/* AI Planning Promotion Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(69, 87, 153, 0.12) 0%, rgba(178, 149, 201, 0.1) 100%)',
              border: '1px solid rgba(69, 87, 153, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem 1.4rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(69, 87, 153, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <Sparkles style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.98rem', display: 'block', color: 'var(--text-primary)' }}>
                  Want AI to build your itinerary automatically?
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Describe your trip in everyday language and let our autonomous agent do the heavy lifting.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/ai-agent')}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.88rem' }}
            >
              <Sparkles style={{ width: 14, height: 14, color: '#FFE0B9' }} />
              <span>Try AI Trip Agent</span>
            </button>
          </div>

          {/* Form Card */}
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
                  placeholder="e.g. Summer Exploration across Southern Europe"
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
                  placeholder="Outline the main vision or notes for this trip..."
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
                  onClick={() => navigate('/trips')}
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
                  {submitting ? 'Creating Trip...' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
