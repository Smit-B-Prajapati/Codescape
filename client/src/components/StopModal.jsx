import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, AlertCircle } from 'lucide-react';

export default function StopModal({ isOpen, onClose, onSubmit, initialData = null, defaultDates = {}, loading = false }) {
  const [formData, setFormData] = useState({
    city: '',
    country: '',
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        city: initialData.city || '',
        country: initialData.country || '',
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        city: defaultDates.city || '',
        country: defaultDates.country || '',
        startDate: defaultDates.startDate || '',
        endDate: defaultDates.endDate || '',
      });
    }
    setError('');
  }, [initialData, defaultDates, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.city.trim() || !formData.country.trim()) {
      setError('City and Country are required');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Arrival and departure dates are required');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('Departure date cannot be before arrival date');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        
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
              <MapPin style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {initialData ? 'Edit Destination Stop' : 'Add Destination Stop'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Set stay dates and location for this leg of the journey
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
          <div className="grid grid-cols-1 grid-cols-2 gap-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Zurich"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Country *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. Switzerland"
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

          <div className="grid grid-cols-1 grid-cols-2 gap-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Arrival Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
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

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Departure Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
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
              {loading ? 'Saving...' : initialData ? 'Update Stop' : 'Add Stop'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
