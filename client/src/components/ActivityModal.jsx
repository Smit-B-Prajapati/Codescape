import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, Tag, AlertCircle } from 'lucide-react';

const CATEGORIES = ['Sightseeing', 'Food', 'Adventure', 'Nature', 'Shopping', 'Culture', 'Other'];

export default function ActivityModal({ isOpen, onClose, onSubmit, stops = [], initialData = null, loading = false }) {
  const [formData, setFormData] = useState({
    stopId: '',
    name: '',
    description: '',
    category: 'Sightseeing',
    date: '',
    time: '09:00',
    duration: 60,
    cost: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        stopId: initialData.stopId || (stops[0]?._id || ''),
        name: initialData.name || '',
        description: initialData.description || '',
        category: initialData.category || 'Sightseeing',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        time: initialData.time || '09:00',
        duration: initialData.duration || 60,
        cost: initialData.cost || 0,
        image: initialData.image || '',
      });
    } else {
      const firstStop = stops[0];
      setFormData({
        stopId: firstStop?._id || '',
        name: '',
        description: '',
        category: 'Sightseeing',
        date: firstStop?.startDate ? new Date(firstStop.startDate).toISOString().split('T')[0] : '',
        time: '09:00',
        duration: 60,
        cost: 0,
        image: '',
      });
    }
    setError('');
  }, [initialData, stops, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.stopId) {
      setError('Please select a destination stop for this activity');
      return;
    }

    if (!formData.name.trim()) {
      setError('Activity name is required');
      return;
    }

    if (!formData.date) {
      setError('Activity date is required');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(69, 87, 153, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Tag style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {initialData ? 'Edit Scheduled Activity' : 'Add Activity to Itinerary'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Customize timing, costs, and destination stop details
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: 34, height: 34, padding: 0, borderRadius: '50%' }}
            aria-label="Close dialog"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(225, 29, 72, 0.12)',
              border: '1px solid rgba(225, 29, 72, 0.3)',
              color: '#e11d48',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
            }}
          >
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Target Stop Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Assign to Destination Stop *
            </label>
            <select
              name="stopId"
              value={formData.stopId}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                outline: 'none',
              }}
              required
            >
              {stops.map((stop) => (
                <option key={stop._id} value={stop._id}>
                  {stop.city}, {stop.country}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Activity Title *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Scuba Diving Session at Grande Island"
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                outline: 'none',
              }}
              required
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 grid-cols-2 gap-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.9rem',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.9rem',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
                required
              />
            </div>
          </div>

          {/* Time, Duration, and Cost */}
          <div className="grid grid-cols-1 grid-cols-3 gap-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.9rem',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Duration (mins)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.9rem',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Cost ($)
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.9rem',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3" style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '0.65rem 1.45rem', fontSize: '0.9rem' }}
            >
              {loading ? 'Saving...' : initialData ? 'Update Activity' : 'Add Activity'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
