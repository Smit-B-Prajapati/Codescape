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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: '#111827', borderRadius: 'var(--radius-md)' }}>
        
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <div className="flex items-center gap-2">
            <MapPin style={{ width: 22, height: 22, color: '#3b82f6' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {initialData ? 'Edit Destination Stop' : 'Add Destination Stop'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
            <AlertCircle style={{ width: 16, height: 16 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 grid-cols-2 gap-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Mumbai"
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Country *</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. India"
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 grid-cols-2 gap-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Arrival Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Departure Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading} style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
              {loading ? 'Saving...' : initialData ? 'Update Stop' : 'Add Stop'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
