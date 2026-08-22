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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex justify-center items-center gap-2" style={{ marginBottom: '1rem' }}>
            <Globe className="pulse-glow" style={{ color: '#3b82f6', width: 32, height: 32 }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.6rem' }}>
              Globe<span className="gradient-text">Trotter</span>
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Reset Password</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Enter your registered email address to receive password reset instructions.
          </p>
        </div>

        {/* Info Banner explaining Email Service status */}
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
          <div className="flex items-center gap-2" style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
            <Info style={{ width: 16, height: 16 }} />
            <span>Email Service Status Notice</span>
          </div>
          <span>Automatic email sending (SMTP) will be configured in a production email provider update. This form demonstrates the security UI workflow.</span>
        </div>

        {status.message && (
          <div style={{ background: status.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${status.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, color: status.success ? '#34d399' : '#fca5a5', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.88rem', lineHeight: '1.5' }}>
            <div className="flex items-center gap-2" style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
              {status.success ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <AlertCircle style={{ width: 16, height: 16 }} />}
              <span>{status.success ? 'Request Received' : 'Notice'}</span>
            </div>
            <span>{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-dimmed)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={status.loading}>
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
          <Link to="/login" className="flex justify-center items-center gap-2" style={{ color: '#60a5fa', fontSize: '0.9rem', textDecoration: 'none' }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            <span>Back to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
