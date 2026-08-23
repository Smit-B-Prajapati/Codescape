import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createTripApi } from '../services/api';
import Navbar from '../components/Navbar';
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

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Plan a New Trip</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Define your travel dates, trip name, and cover banner to start building your itinerary.
            </p>
          </div>

          {/* AI Planning Promotion Banner */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Sparkles style={{ width: 20, height: 20, color: '#818cf8', flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'block', color: 'var(--text-primary)' }}>
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
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.88rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              }}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              <span>Try AI Trip Agent</span>
            </button>
          </div>

          {/* Form Card */}
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
                  placeholder="e.g. Summer Exploration across Southern Europe"
                  style={{ width: '100%', padding: '0.8rem 1rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}
                  required
                />
              </div>

              {/* Start Date & End Date */}
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

              {/* Cover Photo URL */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
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
                  placeholder="Outline the main vision or notes for this trip..."
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

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
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
                  style={{ padding: '0.85rem 1.5rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Creating Trip...' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
