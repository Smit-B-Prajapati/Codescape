import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, confirmText = 'Delete', onConfirm, onCancel, loading = false }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', background: '#111827', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
          <div className="flex items-center gap-2" style={{ color: '#ef4444' }}>
            <AlertTriangle style={{ width: 22, height: 22 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: '1.5' }}>
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn btn-secondary" disabled={loading} style={{ padding: '0.6rem 1.1rem', fontSize: '0.9rem' }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn" disabled={loading} style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '0.6rem 1.1rem', fontSize: '0.9rem', fontWeight: 600 }}>
            {loading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
