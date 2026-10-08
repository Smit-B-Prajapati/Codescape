import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getBookingById } from '../services/bookingApi';
import {
  Train,
  Hotel,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Sparkles,
  Info,
  DollarSign,
} from 'lucide-react';

export default function BookingReview() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  useEffect(() => {
    async function fetchBookingDetails() {
      if (!bookingId) {
        setError('No booking reference provided in URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const res = await getBookingById(bookingId);
        if (res && res.success && res.booking) {
          setBooking(res.booking);
        } else {
          setError('Unable to load booking details');
        }
      } catch (err) {
        console.error('[BookingReview Fetch Error]:', err);
        setError(err.message || 'Failed to fetch booking details from server');
      } finally {
        setLoading(false);
      }
    }

    fetchBookingDetails();
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

  const handleContinuePayment = () => {
    navigate(`/payment/${bookingId || booking?._id || booking?.bookingReference}`);
  };

  const handleBackToPlan = () => {
    if (booking?.trip?._id) {
      navigate(`/trips/${booking.trip._id}/itinerary`);
    } else {
      navigate('/ai-agent');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 1rem' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>

          {/* Top Navigation & Breadcrumbs */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={handleBackToPlan}
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
              <span>Back to Plan</span>
            </button>

            {booking && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dimmed)', fontFamily: 'monospace' }}>
                REF: <strong style={{ color: 'var(--text-primary)' }}>{booking.bookingReference}</strong>
              </span>
            )}
          </div>

          {/* =========================================================================
              CRITICAL DISCLAIMER BANNER (PROMINENT DEMO NOTICE)
             ========================================================================= */}
          <div
            style={{
              padding: '1.15rem 1.5rem',
              background: 'rgba(245, 158, 11, 0.14)',
              border: '2px solid rgba(245, 158, 11, 0.5)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              boxShadow: '0 8px 24px -6px rgba(245, 158, 11, 0.15)',
            }}
          >
            <ShieldAlert style={{ width: 26, height: 26, color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    background: '#f59e0b',
                    color: '#000',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                  }}
                >
                  SIMULATION ONLY
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', margin: 0 }}>
                  DEMO BOOKING — No real travel reservation will be made.
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                Review your booking before continuing. All transport seats, hotel stays, schedules, and pricing are simulated
                strictly for prototype evaluation. No real payment will be charged to any credit card or banking system.
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="glass-card text-center" style={{ padding: '4rem 2rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Retrieving Verified Booking Details...
              </h3>
              <p style={{ color: 'var(--text-dimmed)', fontSize: '0.9rem' }}>
                Fetching reservation parameters from the authenticated backend.
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="glass-card text-center" style={{ padding: '3.5rem 2rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
              <AlertTriangle style={{ width: 44, height: 44, color: '#ef4444', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.5rem' }}>
                Unable to Load Booking
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
                {error}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => navigate('/trips')}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  Go to My Trips
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/ai-agent')}
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  AI Trip Planner
                </button>
              </div>
            </div>
          )}

          {/* Main Booking Review Content */}
          {!loading && !error && booking && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

              {/* Title Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-info" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status: {booking.status}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dimmed)' }}>
                    Type: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{booking.type}</strong>
                  </span>
                </div>
                <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: 0 }}>
                  Booking <span className="gradient-text">Review</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  Review your booking before continuing.
                </p>
              </div>

              {/* =========================================================================
                  SECTION 1: TRIP DETAILS
                 ========================================================================= */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                  <MapPin style={{ width: 20, height: 20, color: 'var(--primary-400)' }} />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Trip Details
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                      Trip Name
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {booking.trip?.name || 'Curated Travel Itinerary'}
                    </span>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                      Destination
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {booking.trip?.destination || booking.details?.city || 'Selected Destination'}
                    </span>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                      Travel Dates
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatDate(booking.trip?.startDate || booking.details?.departureDate)} → {formatDate(booking.trip?.endDate || booking.details?.arrivalDate)}
                    </span>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                      Number of Travelers
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Users style={{ width: 16, height: 16, color: 'var(--primary-400)' }} />
                      {booking.details?.travelers || booking.trip?.travelerCount || 1} Person(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  SECTION 2: TRANSPORT
                 ========================================================================= */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Train style={{ width: 20, height: 20, color: '#3b82f6' }} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Transport
                    </h2>
                  </div>

                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.16)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                    }}
                  >
                    DEMO DATA
                  </span>
                </div>

                {booking.type === 'transport' || booking.details?.transport ? (
                  (() => {
                    const t = booking.details?.transport || booking.details;
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <Train style={{ width: 18, height: 18, color: '#3b82f6' }} />
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                                {t.name || 'Express Rail Service'}
                              </h3>
                              {t.trainNumber && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)', fontFamily: 'monospace' }}>
                                  #{t.trainNumber}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              Provider: {booking.provider || 'Indian Railways (Demo Simulation)'} • Class: <strong>{t.class || 'Standard'}</strong>
                            </span>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Transport Price
                            </span>
                            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                              {formatCurrency(t.totalPrice || booking.amount, booking.currency)}
                            </span>
                            {t.pricePerPerson && t.travelers > 1 && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
                                ({formatCurrency(t.pricePerPerson, booking.currency)} × {t.travelers} pax)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Route & Timing Box */}
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '1rem 1.25rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                              Departure
                            </span>
                            <strong style={{ fontSize: '0.98rem', display: 'block' }}>
                              {t.from || 'Origin Station'}
                            </strong>
                            <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 600 }}>
                              {t.departure || 'Scheduled Time'}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                              Arrival
                            </span>
                            <strong style={{ fontSize: '0.98rem', display: 'block' }}>
                              {t.to || 'Destination Station'}
                            </strong>
                            <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 600 }}>
                              {t.arrival || 'Scheduled Time'}
                            </span>
                          </div>

                          {t.duration && (
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                                Duration
                              </span>
                              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                <Clock style={{ width: 13, height: 13, display: 'inline', marginRight: '4px' }} />
                                {t.duration}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', color: 'var(--text-dimmed)', fontSize: '0.9rem' }}>
                    <Info style={{ width: 16, height: 16, display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    No transport was selected for this specific booking record.
                  </div>
                )}
              </div>

              {/* =========================================================================
                  SECTION 3: HOTEL
                 ========================================================================= */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Hotel style={{ width: 20, height: 20, color: '#10b981' }} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Hotel
                    </h2>
                  </div>

                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.16)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                    }}
                  >
                    DEMO DATA
                  </span>
                </div>

                {booking.type === 'hotel' || booking.details?.hotel ? (
                  (() => {
                    const h = booking.details?.hotel || booking.details;
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
                              {h.name || 'Selected Demo Hotel'}
                            </h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              Location: {h.area || h.city || 'Central City'} • Rating: ★ {h.rating || '4.5'}/5.0
                            </span>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Accommodation Price
                            </span>
                            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>
                              {formatCurrency(h.totalPrice || booking.amount, booking.currency)}
                            </span>
                            {h.pricePerNight && h.nights && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
                                ({formatCurrency(h.pricePerNight, booking.currency)} / night × {h.nights} nights)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dates & Nights Box */}
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '1rem 1.25rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                              Check-In Date
                            </span>
                            <strong style={{ fontSize: '0.98rem' }}>
                              {formatDate(h.checkIn || booking.trip?.startDate)}
                            </strong>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                              Check-Out Date
                            </span>
                            <strong style={{ fontSize: '0.98rem' }}>
                              {formatDate(h.checkOut || booking.trip?.endDate)}
                            </strong>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                              Duration of Stay
                            </span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {h.nights || 3} Night(s)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', color: 'var(--text-dimmed)', fontSize: '0.9rem' }}>
                    <Info style={{ width: 16, height: 16, display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    No hotel was selected for this specific booking record.
                  </div>
                )}
              </div>

              {/* =========================================================================
                  SECTION 4: PRICE SUMMARY
                 ========================================================================= */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                  <Receipt style={{ width: 22, height: 22, color: 'var(--primary-400)' }} />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Price Summary
                  </h2>
                </div>

                {(() => {
                  let transportCost = 0;
                  let accommodationCost = 0;

                  if (booking.type === 'transport') {
                    transportCost = booking.amount;
                  } else if (booking.type === 'hotel') {
                    accommodationCost = booking.amount;
                  } else if (booking.type === 'package') {
                    transportCost = booking.details?.transportCost || 0;
                    accommodationCost = booking.details?.accommodationCost || 0;
                  }

                  const otherCost = 0; // Simulated demo booking fee waived
                  const total = booking.amount;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        <span>Transport Cost</span>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(transportCost, booking.currency)}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        <span>Accommodation Cost</span>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(accommodationCost, booking.currency)}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        <span>Other Applicable Costs (Booking Fee & Taxes)</span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>
                          Waived (Demo)
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: '0.5rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                            Total Estimated Amount
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-dimmed)' }}>
                            Guaranteed by backend valuation
                          </span>
                        </div>

                        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                          {formatCurrency(total, booking.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* =========================================================================
                  SECTION 5: ACTION BUTTONS & SIMULATION MODAL
                 ========================================================================= */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  marginTop: '0.5rem',
                  paddingTop: '1rem',
                }}
              >
                <button
                  type="button"
                  onClick={handleBackToPlan}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.85rem 1.75rem',
                    fontSize: '1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <ArrowLeft style={{ width: 16, height: 16 }} />
                  <span>Back to Plan</span>
                </button>

                <button
                  type="button"
                  onClick={handleContinuePayment}
                  className="btn btn-primary"
                  style={{
                    padding: '0.85rem 2.25rem',
                    fontSize: '1.05rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    backgroundColor: 'var(--primary-600)',
                  }}
                >
                  <CreditCard style={{ width: 18, height: 18 }} />
                  <span>Continue to Test Payment</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </div>

              {/* Test Payment Simulation Notice Modal */}
              {paymentInitiated && (
                <div
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <CheckCircle2 style={{ width: 28, height: 28, color: '#3b82f6', flexShrink: 0 }} />
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>
                        Ready for Test Payment Gateway Simulation
                      </h4>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        Demo Booking Ref <strong>{booking.bookingReference}</strong> is pending payment verification.
                        In accordance with booking safety rules, no real transactions or credentials will be requested.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPaymentInitiated(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
