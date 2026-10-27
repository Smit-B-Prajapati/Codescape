import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getBookingById } from '../services/bookingApi';
import { getPaymentByBooking, downloadConfirmationPdf } from '../services/paymentApi';
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  Train,
  Hotel,
  Receipt,
  Download,
  ArrowRight,
  Compass,
  LayoutDashboard,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchConfirmationData() {
      if (!bookingId) {
        setError('No booking ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // 1. Fetch authenticated booking record
        const bookingRes = await getBookingById(bookingId);
        if (!bookingRes || !bookingRes.success || !bookingRes.booking) {
          throw new Error('Booking record not found or access denied');
        }

        const b = bookingRes.booking;
        setBooking(b);

        // 2. Fetch associated test payment record
        try {
          const paymentRes = await getPaymentByBooking(b.bookingId || b._id);
          if (paymentRes && paymentRes.success && paymentRes.payment) {
            setPayment(paymentRes.payment);
          }
        } catch (_) {
          // If payment lookup fails, booking.details.payment serves as fallback
        }
      } catch (err) {
        console.error('[BookingConfirmation Fetch Error]:', err);
        setError(err.message || 'Unable to retrieve verified booking confirmation');
      } finally {
        setLoading(false);
      }
    }

    fetchConfirmationData();
  }, [bookingId]);

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

  const handleDownloadPdf = async () => {
    if (downloading || !booking) return;

    try {
      setDownloading(true);
      await downloadConfirmationPdf(
        booking.bookingId || booking._id || booking.bookingReference,
        `GlobeThrottle-Demo-Confirmation-${booking.bookingReference}.pdf`
      );
    } catch (err) {
      console.error('[PDF Download Error]:', err);
      alert(err.message || 'Failed to download confirmation PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Determine if booking is confirmed and payment succeeded
  const isConfirmed = booking?.status === 'confirmed';
  const txnId =
    payment?.transactionId ||
    booking?.details?.payment?.transactionId ||
    'TEST-TXN-SIMULATED';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 1rem' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>

          {/* Loading State */}
          {loading && (
            <div className="glass-card text-center" style={{ padding: '4rem 2rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Verifying Confirmation Credentials...
              </h3>
              <p style={{ color: 'var(--text-dimmed)', fontSize: '0.9rem' }}>
                Validating test payment and booking settlement with the backend.
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="glass-card text-center" style={{ padding: '3.5rem 2rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
              <AlertTriangle style={{ width: 44, height: 44, color: '#ef4444', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.5rem' }}>
                Confirmation Unavailable
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
                {error}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link to="/trips" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                  View My Trips
                </Link>
                <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.65rem 1.5rem' }}>
                  Dashboard
                </Link>
              </div>
            </div>
          )}

          {/* Pending or Unconfirmed State */}
          {!loading && !error && booking && !isConfirmed && (
            <div className="glass-card text-center" style={{ padding: '3.5rem 2rem', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
              <Clock style={{ width: 44, height: 44, color: '#f59e0b', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', marginBottom: '0.5rem' }}>
                Payment Pending for this Booking
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
                Booking <strong>{booking.bookingReference}</strong> is currently in{' '}
                <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{booking.status}</span> status.
                Confirmation is only generated after successful test payment simulation.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/payment/${booking.bookingId || booking._id}`)}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.75rem' }}
                >
                  Continue to Test Payment
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/booking/${booking.bookingId || booking._id}`)}
                  className="btn btn-secondary"
                  style={{ padding: '0.75rem 1.75rem' }}
                >
                  Booking Review
                </button>
              </div>
            </div>
          )}

          {/* Confirmed State */}
          {!loading && !error && booking && isConfirmed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

              {/* =========================================================================
                  DISCLAIMER BANNER (HIGHLY VISIBLE DEMO NOTICE)
                 ========================================================================= */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '2px solid rgba(245, 158, 11, 0.5)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  boxShadow: '0 8px 24px -6px rgba(245, 158, 11, 0.15)',
                }}
              >
                <ShieldAlert style={{ width: 28, height: 28, color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        background: 'var(--primary)',
                        color: '#fff',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                      }}
                    >
                      RAZORPAY TEST MODE
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', margin: 0 }}>
                      DEMO CONFIRMATION — This is a simulated booking and is not a real travel reservation or payment receipt.
                    </h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
                    Razorpay test transaction. This is not a live payment. No physical seats or rooms have been booked.
                  </p>
                </div>
              </div>

              {/* Success Hero Header Card */}
              <div
                className="glass-card"
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                  }}
                >
                  <CheckCircle2 style={{ width: 36, height: 36, color: '#10b981' }} />
                </div>

                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#10b981',
                    marginBottom: '0.4rem',
                  }}
                >
                  ✓ TRIP APPROVED &amp; BOOKING CONFIRMED
                </span>

                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
                  Your Trip is <span style={{ color: '#10b981' }}>Approved &amp; Confirmed!</span>
                </h1>

                <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
                  Payment has been successfully received. Your trip plan has been officially approved and confirmed in your GlobeTrotter account.
                </p>

                {/* Primary Metadata Pills */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Booking Reference
                    </span>
                    <strong style={{ fontSize: '1.15rem', color: '#60a5fa', fontFamily: 'monospace' }}>
                      {booking.bookingReference}
                    </strong>
                  </div>

                  <div style={{ height: '30px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Test Transaction
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: '#10b981', fontFamily: 'monospace' }}>
                      {txnId}
                    </strong>
                  </div>

                  <div style={{ height: '30px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Total Validated
                    </span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--primary-400)' }}>
                      {formatCurrency(booking.amount, booking.currency)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Complete Confirmation Breakdown Details */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reservation Overview
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '3px' }}>
                      Trip
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {booking.trip?.name || 'Vacation Itinerary'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '3px' }}>
                      Destination
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin style={{ width: 14, height: 14, color: 'var(--primary-400)' }} />
                      {booking.trip?.destination || 'Destination'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '3px' }}>
                      Dates
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                      {formatDate(booking.trip?.startDate)} → {formatDate(booking.trip?.endDate)}
                    </span>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '3px' }}>
                      Travelers
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Users style={{ width: 14, height: 14, color: 'var(--primary-400)' }} />
                      {booking.trip?.travelerCount || 1} Person(s)
                    </span>
                  </div>
                </div>

                {/* Transport & Hotel Item Breakdown */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Transport Item */}
                  {(booking.type === 'transport' || booking.details?.transport) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Train style={{ width: 20, height: 20, color: 'var(--primary)' }} />
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                            Transport: {booking.details?.transport?.name || booking.details?.name || 'Express Train'}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)' }}>
                            {booking.details?.transport?.from || booking.details?.from} → {booking.details?.transport?.to || booking.details?.to} • Departure: {booking.details?.transport?.departure || booking.details?.departure || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <span className="badge badge-periwinkle" style={{ fontSize: '0.7rem', fontWeight: 700 }}>Verified Route</span>
                    </div>
                  )}

                  {/* Hotel Item */}
                  {(booking.type === 'hotel' || booking.details?.hotel) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Hotel style={{ width: 20, height: 20, color: '#10b981' }} />
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                            Hotel: {booking.details?.hotel?.name || booking.details?.name || 'Curated Accommodation'}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)' }}>
                            {booking.details?.hotel?.nights || booking.details?.nights || 3} Night(s) in {booking.details?.hotel?.city || booking.details?.city || 'Goa'}
                          </span>
                        </div>
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>DEMO DATA</span>
                    </div>
                  )}

                  {/* Payment Details Box */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Gateway Settlement
                        </span>
                        <strong style={{ fontSize: '0.95rem', color: '#10b981' }}>
                          RAZORPAY TEST MODE • {(payment?.status || booking.details?.payment?.status || 'success').toUpperCase()}
                        </strong>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Total Paid
                        </span>
                        <strong style={{ fontSize: '1.25rem', color: 'var(--primary-400)' }}>
                          {formatCurrency(booking.amount, booking.currency)}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.65rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-dimmed)', marginRight: '0.35rem' }}>Razorpay Order ID:</span>
                        <code style={{ color: '#93c5fd', fontFamily: 'monospace' }}>
                          {payment?.orderId || booking.details?.payment?.orderId || 'order_test_demo'}
                        </code>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-dimmed)', marginRight: '0.35rem' }}>Razorpay Payment ID:</span>
                        <code style={{ color: '#10b981', fontFamily: 'monospace' }}>
                          {payment?.razorpayPaymentId || payment?.transactionId || booking.details?.payment?.transactionId || txnId}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  ACTION BUTTONS
                 ========================================================================= */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '0.85rem',
                  marginTop: '0.75rem',
                }}
              >
                {/* View Trip */}
                <button
                  type="button"
                  onClick={() => navigate(`/trips/${booking.trip?._id || booking.trip}`)}
                  className="btn btn-primary"
                  style={{
                    minHeight: '46px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Compass style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>View Trip</span>
                </button>

                {/* View Itinerary */}
                <button
                  type="button"
                  onClick={() => navigate(`/trips/${booking.trip?._id || booking.trip}/itinerary`)}
                  className="btn btn-secondary"
                  style={{
                    minHeight: '46px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Calendar style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>View Itinerary</span>
                </button>

                {/* Download Confirmation PDF */}
                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownloadPdf}
                  className="btn btn-secondary"
                  style={{
                    minHeight: '46px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap',
                    cursor: downloading ? 'not-allowed' : 'pointer',
                    opacity: downloading ? 0.7 : 1,
                  }}
                >
                  <Download style={{ width: 16, height: 16, flexShrink: 0, color: 'var(--primary)' }} />
                  <span>{downloading ? 'Downloading...' : 'Download Confirmation'}</span>
                </button>

                {/* Back to Dashboard */}
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-secondary"
                  style={{
                    minHeight: '46px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <LayoutDashboard style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>Back to Dashboard</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
