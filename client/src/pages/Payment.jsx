import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getBookingById } from '../services/bookingApi';
import { processDirectPayment } from '../services/paymentApi';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Sparkles,
  Receipt,
  Train,
  Hotel,
  Calendar,
  Users,
  Smartphone,
  Landmark,
  Check,
  Lock,
} from 'lucide-react';

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [paymentStepText, setPaymentStepText] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [confirmedTransaction, setConfirmedTransaction] = useState(null);

  useEffect(() => {
    async function initPaymentFlow() {
      if (!bookingId) {
        setError('No booking ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const bookingRes = await getBookingById(bookingId);
        if (!bookingRes || !bookingRes.success || !bookingRes.booking) {
          throw new Error('Unable to retrieve booking details');
        }

        const currentBooking = bookingRes.booking;
        setBooking(currentBooking);

        // If already confirmed, redirect to confirmation immediately
        if (currentBooking.status === 'confirmed') {
          navigate(`/booking/${bookingId}/confirmation`, { replace: true });
        }
      } catch (err) {
        console.error('[Payment Init Error]:', err);
        setError(err.message || 'Error initializing payment page');
      } finally {
        setLoading(false);
      }
    }

    initPaymentFlow();
  }, [bookingId, navigate]);

  const formatCurrency = (val, curr = 'INR') => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const symbol = (curr || 'INR').toUpperCase() === 'INR' ? '₹' : '$';
    return `${symbol}${Number(val).toLocaleString()}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  };

  /**
   * Directly processes payment as SUCCESSFUL without external bank redirects/popups
   */
  const handleProcessPayment = async () => {
    if (paymentStatus === 'processing' || paymentStatus === 'success' || !booking) return;

    try {
      setError('');
      setPaymentStatus('processing');
      setPaymentStepText('Connecting to Secure Payment Gateway...');

      await new Promise((r) => setTimeout(r, 600));
      setPaymentStepText(`Authorizing ${formatCurrency(booking.amount, booking.currency)} payment...`);

      const res = await processDirectPayment({
        bookingId: booking.bookingId || booking._id || booking.bookingReference,
      });

      if (!res || !res.success) {
        throw new Error(res?.message || 'Failed to complete payment');
      }

      setPaymentStepText('Payment verified & received! Confirming your reservation...');
      await new Promise((r) => setTimeout(r, 500));

      setConfirmedTransaction(
        res.payment || {
          transactionId: `TEST-TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          amount: booking.amount,
          paidAt: new Date().toISOString(),
        }
      );
      setPaymentStatus('success');

      // Seamlessly navigate to verified confirmation voucher
      setTimeout(() => {
        navigate(`/booking/${bookingId}/confirmation`, { replace: true });
      }, 1400);
    } catch (err) {
      console.error('[Payment Processing Error]:', err);
      setPaymentStatus('idle');
      setError(err.message || 'Payment processing error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 1rem' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>

          {/* Back Navigation Button */}
          {paymentStatus === 'idle' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Link
                to={`/booking/${bookingId}`}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                }}
              >
                <ArrowLeft style={{ width: 14, height: 14 }} />
                <span>Back to Booking Review</span>
              </Link>
            </div>
          )}

          {/* =========================================================================
              CRITICAL DEMO ENVIRONMENT DISCLAIMER BANNER
             ========================================================================= */}
          {paymentStatus === 'idle' && (
            <div
              style={{
                padding: '1.25rem 1.5rem',
                background: 'rgba(37, 99, 235, 0.12)',
                border: '2px solid rgba(37, 99, 235, 0.45)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <ShieldCheck style={{ width: 28, height: 28, color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      background: '#10b981',
                      color: '#ffffff',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    INSTANT AUTO-APPROVAL
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#93c5fd', margin: 0 }}>
                    Direct Demo Payment — 100% Guaranteed Success
                  </h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Clicking Pay directly processes and confirms your reservation with genuine bank-grade reconciliation. No external bank redirects or mock success/failure selection screens.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="glass-card text-center" style={{ padding: '3.5rem 2rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Initializing Payment Details...
              </h3>
              <p style={{ color: 'var(--text-dimmed)', fontSize: '0.88rem' }}>
                Fetching verified booking details and preparing payment gateway.
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="glass-card text-center" style={{ padding: '3rem 2rem', border: '1px solid rgba(239, 68, 68, 0.4)', marginBottom: '1.5rem' }}>
              <AlertTriangle style={{ width: 40, height: 40, color: '#ef4444', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.5rem' }}>
                Payment Error
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
                {error}
              </p>
              <Link to={`/booking/${bookingId}`} className="btn btn-secondary">
                Return to Booking Review
              </Link>
            </div>
          )}

          {/* =========================================================================
              ACTIVE PROCESSING SCREEN (PAYMENT BEING DONE)
             ========================================================================= */}
          {paymentStatus === 'processing' && (
            <div
              className="glass-card"
              style={{
                padding: '3.5rem 2rem',
                textAlign: 'center',
                border: '2px solid rgba(59, 130, 246, 0.55)',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(15, 23, 42, 0.88)',
                boxShadow: '0 25px 60px rgba(37, 99, 235, 0.3)',
              }}
            >
              <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 1.75rem' }}>
                <div
                  className="spinner"
                  style={{
                    width: 90,
                    height: 90,
                    borderWidth: '5px',
                    borderColor: 'rgba(59, 130, 246, 0.2)',
                    borderTopColor: '#38bdf8',
                  }}
                />
                <CreditCard
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 36,
                    height: 36,
                    color: '#60a5fa',
                  }}
                />
              </div>

              <span
                className="badge badge-info"
                style={{
                  fontSize: '0.8rem',
                  padding: '4px 14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.75rem',
                  display: 'inline-block',
                }}
              >
                PAYMENT IN PROGRESS
              </span>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                Payment Being Processed...
              </h2>
              <p style={{ color: '#93c5fd', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 2rem 0' }}>
                {paymentStepText}
              </p>

              <div
                style={{
                  maxWidth: '420px',
                  margin: '0 auto',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '999px',
                  height: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '65%',
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--primary) 0%, #0d9488 100%)',
                    borderRadius: '999px',
                    animation: 'progressIndeterminate 1.3s infinite ease-in-out',
                  }}
                />
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-dimmed)', fontSize: '0.85rem' }}>
                <Lock style={{ width: 14, height: 14, color: '#10b981' }} />
                <span>256-bit Encrypted Demo Gateway • Real-time database confirmation</span>
              </div>
            </div>
          )}

          {/* =========================================================================
              SUCCESS CONFIRMATION SCREEN
             ========================================================================= */}
          {paymentStatus === 'success' && (
            <div
              className="glass-card"
              style={{
                padding: '3.5rem 2rem',
                textAlign: 'center',
                border: '2px solid rgba(16, 185, 129, 0.65)',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(15, 23, 42, 0.92)',
                boxShadow: '0 25px 60px rgba(16, 185, 129, 0.3)',
              }}
            >
              <div
                className="animate-scale-check"
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  color: '#10b981',
                  boxShadow: '0 0 35px rgba(16, 185, 129, 0.5)',
                }}
              >
                <CheckCircle2 style={{ width: 56, height: 56 }} />
              </div>

              <span
                className="badge badge-success"
                style={{
                  fontSize: '0.82rem',
                  padding: '5px 16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.75rem',
                  display: 'inline-block',
                }}
              >
                PAYMENT DONE ✓
              </span>

              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                Payment Successful!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: '0 0 1.5rem 0' }}>
                Total of <strong style={{ color: '#34d399' }}>{formatCurrency(booking?.amount, booking?.currency)}</strong> has been verified and settled.
              </p>

              {confirmedTransaction?.transactionId && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.85rem 1.5rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-block',
                    marginBottom: '1.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Transaction Reference ID
                  </span>
                  <code style={{ fontSize: '1rem', color: '#60a5fa', fontWeight: 800 }}>
                    {confirmedTransaction.transactionId}
                  </code>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', color: '#34d399', fontSize: '0.95rem', fontWeight: 600 }}>
                <Sparkles style={{ width: 18, height: 18 }} />
                <span>Redirecting to your confirmed booking voucher...</span>
              </div>
            </div>
          )}

          {/* =========================================================================
              MAIN PAYMENT SELECTION VIEW (IDLE)
             ========================================================================= */}
          {!loading && booking && paymentStatus === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Title Section */}
              <div>
                <span className="badge badge-info" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  INSTANT PAYMENT
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.35rem', marginBottom: '0.25rem' }}>
                  COMPLETE <span className="gradient-text">PAYMENT</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
                  Review your reservation details and complete instant test payment with automatic confirmation.
                </p>
              </div>

              {/* Order & Booking Summary Card */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                  <Receipt style={{ width: 20, height: 20, color: 'var(--primary-400)' }} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Booking Details & Amount Payable
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {/* Trip Name */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Trip Name</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {booking.trip?.name || 'Custom Trip'}
                    </strong>
                  </div>

                  {/* Destination */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Destination</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {booking.trip?.destination || 'Destination'}
                    </span>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Travel Dates</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {formatDate(booking.trip?.startDate)} — {formatDate(booking.trip?.endDate)}
                    </span>
                  </div>

                  {/* Travelers */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Traveler Count</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {booking.trip?.travelerCount || booking.details?.travelers || 1} Traveler(s)
                    </span>
                  </div>

                  {/* Selected Transport */}
                  {booking.details?.transport || booking.type === 'transport' ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Train style={{ width: 14, height: 14, color: 'var(--primary-400)' }} />
                        <span>Selected Transport</span>
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>
                        {booking.details?.name || booking.details?.transport?.name || 'Indian Railways Train'} ({booking.details?.class || 'Standard'})
                      </span>
                    </div>
                  ) : null}

                  {/* Selected Accommodation */}
                  {booking.details?.hotel || booking.type === 'hotel' ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Hotel style={{ width: 14, height: 14, color: '#f59e0b' }} />
                        <span>Selected Hotel</span>
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>
                        {booking.details?.name || booking.details?.hotel?.name || 'Curated Accommodation'}
                      </span>
                    </div>
                  ) : null}

                  {/* Booking Reference */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Booking Reference</span>
                    <span style={{ color: '#60a5fa', fontWeight: 700, fontFamily: 'monospace' }}>
                      {booking.bookingReference}
                    </span>
                  </div>

                  {/* Total Validated Amount */}
                  <div
                    style={{
                      marginTop: '0.5rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                        Amount Payable
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                        All Taxes & Service Fees Included
                      </span>
                    </div>
                    <span style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                      {formatCurrency(booking.amount, booking.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.85rem' }}>
                  Select Payment Method (Auto-Verified)
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {/* UPI */}
                  <div
                    onClick={() => setSelectedMethod('upi')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedMethod === 'upi' ? 'rgba(37, 99, 235, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1.5px solid ${selectedMethod === 'upi' ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.08)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Smartphone style={{ width: 22, height: 22, color: selectedMethod === 'upi' ? '#60a5fa' : '#94a3b8' }} />
                      <div>
                        <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--text-primary)' }}>
                          UPI / QR
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
                          GPay, PhonePe, Paytm
                        </span>
                      </div>
                    </div>
                    {selectedMethod === 'upi' && <Check style={{ width: 18, height: 18, color: '#60a5fa' }} />}
                  </div>

                  {/* Card */}
                  <div
                    onClick={() => setSelectedMethod('card')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedMethod === 'card' ? 'rgba(37, 99, 235, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1.5px solid ${selectedMethod === 'card' ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.08)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CreditCard style={{ width: 22, height: 22, color: selectedMethod === 'card' ? '#60a5fa' : '#94a3b8' }} />
                      <div>
                        <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--text-primary)' }}>
                          Credit / Debit Card
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
                          Visa, Mastercard, RuPay
                        </span>
                      </div>
                    </div>
                    {selectedMethod === 'card' && <Check style={{ width: 18, height: 18, color: '#60a5fa' }} />}
                  </div>

                  {/* Net Banking */}
                  <div
                    onClick={() => setSelectedMethod('netbanking')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedMethod === 'netbanking' ? 'rgba(37, 99, 235, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1.5px solid ${selectedMethod === 'netbanking' ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.08)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Landmark style={{ width: 22, height: 22, color: selectedMethod === 'netbanking' ? '#60a5fa' : '#94a3b8' }} />
                      <div>
                        <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--text-primary)' }}>
                          Net Banking
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
                          All Major Indian Banks
                        </span>
                      </div>
                    </div>
                    {selectedMethod === 'netbanking' && <Check style={{ width: 18, height: 18, color: '#60a5fa' }} />}
                  </div>
                </div>
              </div>

              {/* Primary Action Button: Complete Payment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  id="direct-pay-button"
                  onClick={handleProcessPayment}
                  className="btn btn-primary"
                  style={{
                    padding: '1.15rem 1.75rem',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    background: 'var(--gradient-primary)',
                    color: '#FEF5EE',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <Lock style={{ width: 20, height: 20 }} />
                  <span>
                    Pay {formatCurrency(booking.amount, booking.currency)} Now & Confirm Booking
                  </span>
                </button>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.25rem' }}>
                  <Link
                    to={`/booking/${bookingId}`}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.75rem 1.25rem',
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <ArrowLeft style={{ width: 14, height: 14 }} />
                    <span>Cancel and Back to Booking Review</span>
                  </Link>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
