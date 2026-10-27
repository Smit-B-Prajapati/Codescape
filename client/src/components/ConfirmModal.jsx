import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true">
      <div
        className="modal-dialog"
        style={{ maxWidth: '440px', border: '1px solid rgba(225, 29, 72, 0.35)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
          <div className="flex items-center gap-2" style={{ color: '#e11d48' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(225, 29, 72, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle style={{ width: 18, height: 18, color: '#e11d48' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
            aria-label="Close dialog"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: '1.55' }}>
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
            style={{ padding: '0.6rem 1.15rem', fontSize: '0.9rem' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
