import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '../services/api';
import { Globe, Mail, ArrowLeft, Send, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, success: false, message: '', configured: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus({ loading: true, success: false, message: '', configured: false });

    try {
      const response = await forgotPasswordApi({ email });
      setStatus({
        loading: false,
        success: true,
        message: response.message,
        configured: response.configured || false,
      });
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        message: error.message || 'Unable to process reset request.',
        configured: false,
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2.75rem', borderRadius: 'var(--radius-lg)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex justify-center items-center gap-2" style={{ marginBottom: '1rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #455799 0%, #10182F 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe style={{ color: '#FEF5EE', width: 22, height: 22 }} />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)' }}>
              Globe<span className="gradient-text">Trotter</span>
            </span>
          </div>
          <h2 className="editorial-display" style={{ fontSize: '1.9rem', marginBottom: '0.45rem', fontWeight: 800 }}>
            Reset Password
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
            Enter your registered email address to receive password reset instructions.
          </p>
        </div>

        {/* Info Banner */}
        <div
          style={{
            background: 'var(--surface-warm)',
            border: '1px solid rgba(255, 224, 185, 0.4)',
            color: 'var(--text-secondary)',
            padding: '0.85rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.84rem',
            lineHeight: '1.5',
          }}
        >
          <div className="flex items-center gap-2" style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            <Info style={{ width: 16, height: 16, color: 'var(--primary)' }} />
            <span>Email Service Status Notice</span>
          </div>
          <span>Automatic email sending (SMTP) will be configured in a production email provider update. This form demonstrates the security UI workflow.</span>
        </div>

        {status.message && (
          <div
            style={{
              background: status.success ? 'rgba(13, 148, 136, 0.12)' : 'rgba(225, 29, 72, 0.12)',
              border: `1px solid ${status.success ? 'rgba(13, 148, 136, 0.3)' : 'rgba(225, 29, 72, 0.3)'}`,
              color: status.success ? '#0d9488' : '#e11d48',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              lineHeight: '1.5',
            }}
          >
            <div className="flex items-center gap-2" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
              {status.success ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <AlertCircle style={{ width: 16, height: 16 }} />}
              <span>{status.success ? 'Request Received' : 'Notice'}</span>
            </div>
            <span>{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-dimmed)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem' }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.88rem', fontWeight: 700 }} disabled={status.loading}>
            {status.loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>Submit Reset Request</span>
                <Send style={{ width: 16, height: 16 }} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/login" className="flex justify-center items-center gap-2" style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
