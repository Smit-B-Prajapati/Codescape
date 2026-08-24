import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, AlertCircle, Users, Plus, UserPlus } from 'lucide-react';

const CATEGORIES = ['Transportation', 'Accommodation', 'Food', 'Activities', 'Other'];
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'USD ($)' },
  { code: 'EUR', symbol: '€', name: 'EUR (€)' },
  { code: 'GBP', symbol: '£', name: 'GBP (£)' },
  { code: 'JPY', symbol: '¥', name: 'JPY (¥)' },
  { code: 'INR', symbol: '₹', name: 'INR (₹)' },
  { code: 'CAD', symbol: 'C$', name: 'CAD (C$)' },
  { code: 'AUD', symbol: 'A$', name: 'AUD (A$)' },
];

export default function ExpenseModal({ isOpen, onClose, onSubmit, initialData = null, travelers = [], loading = false }) {
  const [availableTravelers, setAvailableTravelers] = useState(() => {
    if (travelers && travelers.length > 0) return travelers;
    return ['You', 'Alex', 'Elena'];
  });

  const [newTravelerInput, setNewTravelerInput] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Transportation',
    amount: '',
    currency: 'USD',
    paidBy: 'You',
    splitAmong: ['You'],
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const list = (travelers && travelers.length > 0) ? travelers : ['You', 'Alex', 'Elena'];
    setAvailableTravelers(list);

    if (initialData) {
      setFormData({
        category: initialData.category || 'Transportation',
        amount: initialData.originalAmount || initialData.amount || '',
        currency: initialData.currency || 'USD',
        paidBy: initialData.paidBy || list[0] || 'You',
        splitAmong: initialData.splitAmong && initialData.splitAmong.length > 0 ? initialData.splitAmong : list,
        description: initialData.description || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        category: 'Transportation',
        amount: '',
        currency: 'USD',
        paidBy: list[0] || 'You',
        splitAmong: list,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setError('');
  }, [initialData, isOpen, travelers]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleAddCustomTraveler = () => {
    if (!newTravelerInput.trim()) return;
    const name = newTravelerInput.trim();
    if (!availableTravelers.includes(name)) {
      const updated = [...availableTravelers, name];
      setAvailableTravelers(updated);
      setFormData((prev) => ({
        ...prev,
        splitAmong: [...(prev.splitAmong || []), name],
      }));
    }
    setNewTravelerInput('');
    setShowAddInput(false);
  };

  const handleQuickGroupSize = (num) => {
    let preset = ['You'];
    if (num === 2) preset = ['You', 'Companion 2'];
    if (num === 3) preset = ['You', 'Alex', 'Elena'];
    if (num === 4) preset = ['You', 'Alex', 'Elena', 'Marco'];
    setAvailableTravelers(preset);
    setFormData((prev) => ({
      ...prev,
      paidBy: preset[0],
      splitAmong: preset,
    }));
  };

  const toggleSplitTraveler = (person) => {
    const current = formData.splitAmong || [];
    if (current.includes(person)) {
      if (current.length === 1) return;
      setFormData({ ...formData, splitAmong: current.filter((p) => p !== person) });
    } else {
      setFormData({ ...formData, splitAmong: [...current, person] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid expense amount greater than 0');
      return;
    }

    if (!formData.date) {
      setError('Expense date is required');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem', background: '#111827', borderRadius: 'var(--radius-md)' }}>
        
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <div className="flex items-center gap-2">
            <DollarSign style={{ width: 22, height: 22, color: '#f59e0b' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {initialData ? 'Edit Expense Record' : 'Record New Expense'}
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
          
          {/* Category & Currency Row */}
          <div className="grid grid-cols-1 grid-cols-2 gap-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} style={{ backgroundColor: '#111827', color: '#ffffff' }}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Currency *</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                    {curr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Date Row */}
          <div className="grid grid-cols-1 grid-cols-2 gap-3">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Amount ({formData.currency}) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                required
              />
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

          {/* Group Expense Splitter Section */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
              <div className="flex items-center gap-2">
                <Users style={{ width: 16, height: 16, color: '#34d399' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Group Trip Expense Splitter</span>
              </div>

              {/* Quick Group Presets */}
              <div className="flex items-center gap-1">
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Size:</span>
                <button type="button" onClick={() => handleQuickGroupSize(2)} className="btn btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>2P</button>
                <button type="button" onClick={() => handleQuickGroupSize(3)} className="btn btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>3P</button>
                <button type="button" onClick={() => handleQuickGroupSize(4)} className="btn btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>4P</button>
              </div>
            </div>

            <div className="grid grid-cols-1 grid-cols-2 gap-3" style={{ marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Paid By:</label>
                <select
                  name="paidBy"
                  value={formData.paidBy}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#ffffff', fontSize: '0.85rem', outline: 'none' }}
                >
                  {availableTravelers.map((person) => (
                    <option key={person} value={person} style={{ backgroundColor: '#111827', color: '#ffffff' }}>{person}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Split Equally Among:</label>
                  <button
                    type="button"
                    onClick={() => setShowAddInput(!showAddInput)}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Add Companion
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {availableTravelers.map((person) => {
                    const isSelected = formData.splitAmong?.includes(person);
                    return (
                      <button
                        type="button"
                        key={person}
                        onClick={() => toggleSplitTraveler(person)}
                        style={{
                          padding: '0.3rem 0.55rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: isSelected ? '1px solid #34d399' : '1px solid var(--border-glass)',
                          backgroundColor: isSelected ? 'rgba(52, 211, 153, 0.2)' : 'transparent',
                          color: isSelected ? '#34d399' : 'var(--text-dimmed)',
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{person}
                      </button>
                    );
                  })}
                </div>

                {showAddInput && (
                  <div className="flex items-center gap-1" style={{ marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      value={newTravelerInput}
                      onChange={(e) => setNewTravelerInput(e.target.value)}
                      placeholder="Companion Name..."
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', backgroundColor: 'rgba(0, 0, 0, 0.5)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: '#ffffff', outline: 'none', width: '120px' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTraveler}
                      className="btn btn-primary"
                      style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Description / Notes</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Group dinner at bistro or Flight tickets"
              style={{ width: '100%', padding: '0.75rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <div className="flex justify-end gap-3" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading} style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
              {loading ? 'Saving...' : initialData ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
