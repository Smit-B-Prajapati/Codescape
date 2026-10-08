import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getBookingById } from '../services/bookingApi';
import {
  loadRazorpayCheckoutScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../services/paymentApi';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  Receipt,
  RotateCcw,
  Train,
  Hotel,
  Calendar,
  Users,
} from 'lucide-react';

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initiatingOrder, setInitiatingOrder] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState('');
  const [paymentNotice, setPaymentNotice] = useState(null);

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

        // 1. Fetch booking information from authenticated backend
        const bookingRes = await getBookingById(bookingId);
        if (!bookingRes || !bookingRes.success || !bookingRes.booking) {
          throw new Error('Unable to retrieve booking details');
        }

        const currentBooking = bookingRes.booking;
        setBooking(currentBooking);

        // If already confirmed, redirect to confirmation immediately
        if (currentBooking.status === 'confirmed') {
          navigate(`/booking/${bookingId}/confirmation`, { replace: true });
          return;
        }

        // 2. Preload official Razorpay Standard Checkout SDK
        const loaded = await loadRazorpayCheckoutScript();
        setSdkReady(loaded);
        if (!loaded) {
          console.warn('[Razorpay] Script failed to preload; will retry on checkout click.');
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
   * Handles opening the official Razorpay Standard Checkout modal
   */
  const handleOpenRazorpayCheckout = async () => {
    if (initiatingOrder || verifying || !booking) return;

    try {
      setInitiatingOrder(true);
      setError('');
      setPaymentNotice(null);

      // 1. Ensure Razorpay Checkout SDK is loaded
      let isLoaded = sdkReady || (typeof window !== 'undefined' && Boolean(window.Razorpay));
      if (!isLoaded) {
        isLoaded = await loadRazorpayCheckoutScript();
        setSdkReady(isLoaded);
      }

      if (!isLoaded || typeof window.Razorpay === 'undefined') {
        throw new Error(
          'Failed to load the Razorpay Checkout SDK. Please check your internet connection and try again.'
        );
      }

      // 2. Call backend create-order endpoint to generate verified order
      const orderRes = await createRazorpayOrder({
        bookingId: booking.bookingId || booking._id || booking.bookingReference,
      });

      if (!orderRes || !orderRes.success || !orderRes.orderId || !orderRes.keyId) {
        throw new Error(orderRes?.message || 'Failed to create payment order with gateway');
      }

      const { keyId, orderId, amount, currency } = orderRes;

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'GlobeThrottle',
        description: `${booking.trip?.name || 'Travel'} - ${booking.type?.toUpperCase()} (Test Mode)`,
        image: 'https://cdn-icons-png.flaticon.com/512/201/201623.png',
        order_id: orderId,
        handler: async function (response) {
          // Response contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
          try {
            setVerifying(true);
            setInitiatingOrder(false);

            const verifyRes = await verifyRazorpayPayment({
              bookingId: booking.bookingId || booking._id || booking.bookingReference,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes && verifyRes.success) {
              // Successfully verified by backend! Navigate to confirmation page
              navigate(`/booking/${bookingId}/confirmation`);
            } else {
              throw new Error(verifyRes?.message || 'Payment verification could not be completed.');
            }
          } catch (verifyErr) {
            console.error('[Verification Error]:', verifyErr);
            setError(verifyErr.message || 'Payment verification failed on the server.');
            setPaymentNotice({
              type: 'error',
              title: 'Verification Failed',
              message: verifyErr.message || 'Payment signature could not be verified by backend.',
            });
          } finally {
            setVerifying(false);
          }
        },
        prefill: {
          name: booking.trip?.travelers?.[0] || 'Demo Traveler',
          email: 'traveler@globetrotter.demo',
          contact: '9999999999',
        },
        notes: {
          bookingReference: booking.bookingReference,
          tripId: booking.trip?._id || '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setInitiatingOrder(false);
            setPaymentNotice({
              type: 'info',
              title: 'Checkout Dismissed',
              message: 'Payment window was closed. You can retry payment at any time.',
            });
          },
        },
      };

      // 4. Open Razorpay Checkout modal
      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', function (failureResponse) {
        console.error('[Razorpay Payment Failed]:', failureResponse.error);
        setInitiatingOrder(false);
        setPaymentNotice({
          type: 'error',
          title: 'Payment Incomplete',
          message: failureResponse.error?.description || 'The test transaction could not be processed.',
        });
      });

      rzpInstance.open();
    } catch (err) {
      console.error('[Razorpay Order/Checkout Error]:', err);
      setError(err.message || 'Unable to open payment checkout');
      setInitiatingOrder(false);
    }
  };

  const isProcessing = initiatingOrder || verifying;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 1rem' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>

          {/* Back Navigation Button */}
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

          {/* =========================================================================
              CRITICAL TEST ENVIRONMENT DISCLAIMER BANNER
             ========================================================================= */}
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
                    background: '#2563eb',
                    color: '#ffffff',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                  }}
                >
                  RAZORPAY TEST MODE
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#93c5fd', margin: 0 }}>
                  Test payment environment. No real money will be charged.
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
                Integrated with official Razorpay Standard Checkout in test mode. You can use Razorpay's documented test payment credentials (cards, UPI, netbanking) to test the complete booking lifecycle.
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="glass-card text-center" style={{ padding: '3.5rem 2rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Initializing Payment System...
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
                Payment Initialization Error
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
                {error}
              </p>
              <Link to={`/booking/${bookingId}`} className="btn btn-secondary">
                Return to Booking Review
              </Link>
            </div>
          )}

          {/* Main Payment View */}
          {!loading && booking && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Title Section */}
              <div>
                <span className="badge badge-info" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  GATEWAY: RAZORPAY TEST MODE
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.35rem', marginBottom: '0.25rem' }}>
                  SECURE <span className="gradient-text">PAYMENT</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
                  Review your reservation details and complete test payment via official Razorpay Checkout.
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
                        Razorpay Test Mode • Verified Server Amount
                      </span>
                    </div>
                    <span style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                      {formatCurrency(booking.amount, booking.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Notice / Feedback Box */}
              {paymentNotice && (
                <div
                  style={{
                    padding: '1.25rem',
                    background: paymentNotice.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    border: `1px solid ${paymentNotice.type === 'error' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(59, 130, 246, 0.45)'}`,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  {paymentNotice.type === 'error' ? (
                    <XCircle style={{ width: 24, height: 24, color: '#ef4444', flexShrink: 0 }} />
                  ) : (
                    <Clock style={{ width: 24, height: 24, color: '#60a5fa', flexShrink: 0 }} />
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem', color: paymentNotice.type === 'error' ? '#ef4444' : '#60a5fa', fontSize: '1rem', fontWeight: 700 }}>
                      {paymentNotice.title}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                      {paymentNotice.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Primary Action Button: Pay with Razorpay */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  id="razorpay-pay-button"
                  disabled={isProcessing}
                  onClick={handleOpenRazorpayCheckout}
                  className="btn btn-primary"
                  style={{
                    padding: '1.1rem 1.75rem',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    backgroundColor: '#2563eb',
                    opacity: isProcessing ? 0.65 : 1,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  }}
                >
                  <CreditCard style={{ width: 22, height: 22 }} />
                  <span>
                    {verifying
                      ? 'Verifying Payment with Server...'
                      : initiatingOrder
                      ? 'Opening Razorpay Gateway...'
                      : 'Pay Securely with Razorpay (Test Mode)'}
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
    </div>
  );
}
