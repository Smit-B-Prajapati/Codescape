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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem', background: '#111827', borderRadius: 'var(--radius-md)' }}>
        
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <div className="flex items-center gap-2">
            <Tag style={{ width: 22, height: 22, color: '#3b82f6' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Add Activity to Trip Stop
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
          {/* Target Stop Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Assign to Destination Stop *
            </label>
            <select
              name="stopId"
              value={formData.stopId}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              required
            >
              {stops.map((stop) => (
                <option key={stop._id} value={stop._id} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
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
              style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              required
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 grid-cols-2 gap-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} style={{ backgroundColor: '#111827', color: '#ffffff' }}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                required
              />
            </div>
          </div>

          {/* Time, Duration, and Cost */}
          <div className="grid grid-cols-1 grid-cols-3 gap-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Duration (mins)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="0"
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Cost ($)</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading} style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
              {loading ? 'Adding...' : 'Add Activity'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
