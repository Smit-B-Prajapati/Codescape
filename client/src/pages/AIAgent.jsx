import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { planTripWithAgent, approveTripPlan } from '../services/agentApi';
import { prepareBooking } from '../services/bookingApi';
import { createTripApi } from '../services/api';
import AgentActivityLog from '../components/AgentActivityLog';
import TransportOption from '../components/TransportOption';
import HotelOption from '../components/HotelOption';
import BookingSummary from '../components/BookingSummary';
import './AIAgent.css';

import {
  Sparkles,
  Send,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Plane,
  Train,
  Bus,
  Hotel,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  Tag,
  Sunrise,
  Sun,
  Moon,
  Check,
  RefreshCw,
  Star,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sliders,
  DollarSign,
  Coffee,
} from 'lucide-react';

const PRESET_PROMPTS = [
  'Plan a 5 day Goa trip from Vadodara for 2 people under ₹20,000. I want beaches, nightlife and good food.',
  'Plan a weekend heritage getaway to Jaipur for couple under ₹15,000 with sightseeing and cultural dining.',
  'Plan a 3-day Mumbai exploration for 1 person under ₹12,000 with street food and art galleries.',
  'Plan a 4-day Goa relaxation trip under ₹18,000 for 2 travelers prioritizing quiet beaches and cafes.',
];

const STAGES = [
  { id: 'requirements_parsing', label: 'Understanding requirements' },
  { id: 'transport_search', label: 'Searching transport' },
  { id: 'hotel_search', label: 'Searching hotels' },
  { id: 'activity_search', label: 'Finding activities' },
  { id: 'budget_calculation', label: 'Checking budget' },
  { id: 'replanning', label: 'Re-planning (optimizing choices)' },
  { id: 'itinerary_assembly', label: 'Itinerary generated' },
];

export default function AIAgent() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [error, setError] = useState('');
  const [missingInfo, setMissingInfo] = useState([]);
  const [warningMessage, setWarningMessage] = useState('');
  const [planData, setPlanData] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [savedTripId, setSavedTripId] = useState(null);
  const [savingTrip, setSavingTrip] = useState(false);
  const navigate = useNavigate();

  const textareaRef = useRef(null);
  const resultsRef = useRef(null);
  const stageTimerRef = useRef(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, []);

  const handleSelectPreset = (preset) => {
    setMessage(preset);
    setError('');
    setMissingInfo([]);
    setWarningMessage('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handlePlanTrip = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    setError('');
    setMissingInfo([]);
    setWarningMessage('');
    setIsApproved(false);
    setSavedTripId(null);
    setActiveStageIndex(0);

    // Simulate progressive execution stepper while waiting for the response
    stageTimerRef.current = setInterval(() => {
      setActiveStageIndex((prev) => {
        if (prev < STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 850);

    try {
      const response = await planTripWithAgent({ message: message.trim() });

      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      setActiveStageIndex(STAGES.length - 1);

      if (response.status === 'needs_input' || response.requiresUserInput) {
        setMissingInfo(response.missingInformation || ['destination']);
        setWarningMessage(response.message || 'Additional details are needed to complete your plan.');
        setPlanData(response);
      } else if (response.success) {
        setPlanData(response);
        setMissingInfo([]);
        setWarningMessage('');

        // Smooth scroll to results
        setTimeout(() => {
          if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      } else {
        setError(response.message || 'The agent could not formulate a plan.');
      }
    } catch (err) {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      console.error('[AI Agent Frontend Error]:', err);
      setError(err.message || 'An unexpected error occurred while connecting to the agent.');
    } finally {
      setLoading(false);
    }
  };

  const handleModifyPlan = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleApproveTrip = async () => {
    if (!planData) return;

    try {
      setSavingTrip(true);
      setError('');
      setIsApproved(true);

      const res = await approveTripPlan(planData);
      if (res && res.success && res.tripId) {
        setSavedTripId(res.tripId);
        setTimeout(() => {
          navigate(`/trips/${res.tripId}/itinerary`);
        }, 1200);
      }
    } catch (saveErr) {
      console.warn('[AI Agent Trip Save Notice]:', saveErr.message);
      if (saveErr.tripId) {
        setSavedTripId(saveErr.tripId);
        setTimeout(() => {
          navigate(`/trips/${saveErr.tripId}/itinerary`);
        }, 1200);
      } else {
        setError(saveErr.message || 'Failed to approve trip plan');
        setIsApproved(false);
      }
    } finally {
      setSavingTrip(false);
    }
  };

  const handleBookOption = async (type, option) => {
    let tripId = savedTripId;
    if (!tripId) {
      try {
        setSavingTrip(true);
        const approveRes = await approveTripPlan(planData);
        if (approveRes && approveRes.success && approveRes.tripId) {
          tripId = approveRes.tripId;
          setSavedTripId(tripId);
          setIsApproved(true);
        }
      } catch (err) {
        if (err.tripId) {
          tripId = err.tripId;
          setSavedTripId(tripId);
          setIsApproved(true);
        } else {
          setError(err.message || 'Please approve your trip plan before preparing a demo booking');
          setSavingTrip(false);
          return;
        }
      } finally {
        setSavingTrip(false);
      }
    }

    if (tripId) {
      try {
        setLoading(true);
        const optionId = option.id || option.trainNumber || option.hotelId;
        const res = await prepareBooking({
          tripId,
          type,
          optionId,
        });

        if (res && res.success && res.booking) {
          navigate(`/booking/${res.booking.bookingId || res.booking.bookingReference}`);
        }
      } catch (err) {
        setError(err.message || 'Failed to prepare demo booking');
      } finally {
        setLoading(false);
      }
    }
  };

  // Format currency helpers
  const formatCurrency = (val, curr = 'INR') => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const symbol = (curr || 'INR').toUpperCase() === 'INR' ? '₹' : '$';
    return `${symbol}${Number(val).toLocaleString()}`;
  };

  const req = planData?.requirements || {};
  const itinerary = planData?.itinerary || {};
  const budget = planData?.budget || {};
  const transportList = planData?.transportOptions || [];
  const hotelList = planData?.hotelOptions || [];
  const selectedTransport = planData?.selectedOptions?.transport;
  const selectedHotel = planData?.selectedOptions?.hotel;
  const executionLog = planData?.agent?.executionLog || [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <main className="ai-agent-container" style={{ flex: 1 }}>
        <div className="container">
          
          {/* =========================================================================
              SECTION 1: AI TRIP PLANNER HEADER & REQUEST INPUT
             ========================================================================= */}
          <div className="ai-agent-header text-center">
            <div className="ai-badge">
              <Sparkles style={{ width: 14, height: 14 }} /> Autonomous Travel Agent
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              AI <span className="gradient-text">Trip Planner</span>
            </h1>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--text-secondary)' }}>
              Tell us about your trip in everyday language. Our autonomous agent will discover routes,
              evaluate hotels, select local activities, and balance your budget in real time.
            </p>
          </div>

          <div className="glass-card ai-prompt-card">
            <label style={{ display: 'block', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.65rem' }}>
              Tell us about your trip
            </label>

            <textarea
              ref={textareaRef}
              className="ai-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Example: "Plan a 5 day Goa trip from Vadodara for 2 people under ₹20,000. I want beaches, nightlife and good food."'
              disabled={loading}
              rows={4}
            />

            <div style={{ marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)', fontWeight: 600, textTransform: 'uppercase' }}>
                Quick Inspiration Examples:
              </span>
              <div className="quick-prompts-wrapper">
                {PRESET_PROMPTS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    className="quick-prompt-pill"
                    onClick={() => handleSelectPreset(preset)}
                    disabled={loading}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#f87171',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dimmed)' }}>
                Deterministic budget & schedule validation • Real catalog activities
              </span>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePlanTrip}
                disabled={loading || !message.trim()}
                style={{ minWidth: '180px', padding: '0.85rem 1.75rem', fontSize: '1rem' }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="spin-icon" style={{ width: 18, height: 18 }} />
                    <span>Agent Planning...</span>
                  </>
                ) : (
                  <>
                    <Sparkles style={{ width: 18, height: 18 }} />
                    <span>Plan My Trip</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* =========================================================================
              AI-GENERATED PLAN REVIEW BANNER
             ========================================================================= */}
          {planData && !loading && (
            <div className="ai-review-banner glass-card" ref={resultsRef}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    AI-generated plan — review before approval
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    Synthesized via autonomous tools and deterministic budget constraints. Review all segments before approving.
                  </p>
                </div>
              </div>

              {!isApproved ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApproveTrip}
                  style={{
                    padding: '0.65rem 1.4rem',
                    fontSize: '0.95rem',
                    backgroundColor: '#10b981',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                  <span>Approve Trip</span>
                </button>
              ) : (
                <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                  ✓ Plan Approved
                </span>
              )}
            </div>
          )}

          {/* =========================================================================
              SECTION 2: AGENT ACTIVITY LOG
             ========================================================================= */}
          {(loading || planData || executionLog.length > 0) && (
            <AgentActivityLog
              loading={loading}
              activeStageIndex={activeStageIndex}
              stages={STAGES}
              executionLog={executionLog}
              missingInfo={missingInfo}
              warningMessage={warningMessage}
            />
          )}

          {/* =========================================================================
              SECTION 3: TRIP REQUIREMENTS
             ========================================================================= */}
          {planData && req.destinations && (
            <div className="ai-section">
              <div className="ai-section-title">
                <MapPin style={{ width: 20, height: 20, color: 'var(--primary-500)' }} />
                <span>TRIP REQUIREMENTS</span>
              </div>

              <div className="req-grid">
                <div className="req-card">
                  <div className="req-label">
                    <MapPin style={{ width: 14, height: 14 }} /> Destination
                  </div>
                  <div className="req-value">
                    {req.destinations.join(', ')}
                  </div>
                </div>

                <div className="req-card">
                  <div className="req-label">
                    <Calendar style={{ width: 14, height: 14 }} /> Dates & Duration
                  </div>
                  <div className="req-value">
                    {req.durationDays || 3} Days ({Math.max(1, (req.durationDays || 3) - 1)} Nights)
                  </div>
                </div>

                <div className="req-card">
                  <div className="req-label">
                    <Users style={{ width: 14, height: 14 }} /> Travelers
                  </div>
                  <div className="req-value">
                    {req.travelers || 1} Person{req.travelers > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="req-card">
                  <div className="req-label">
                    <CreditCard style={{ width: 14, height: 14 }} /> Budget
                  </div>
                  <div className="req-value">
                    {req.budget ? formatCurrency(req.budget, req.currency) : 'Flexible'}
                  </div>
                </div>

                <div className="req-card">
                  <div className="req-label">
                    <Tag style={{ width: 14, height: 14 }} /> Interests
                  </div>
                  <div className="req-value" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                    {req.interests && req.interests.length > 0 ? (
                      req.interests.map((interest, i) => (
                        <span key={i} className="badge badge-info" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span>General Exploration</span>
                    )}
                  </div>
                </div>

                <div className="req-card">
                  <div className="req-label">
                    <Train style={{ width: 14, height: 14 }} /> Transport Preference
                  </div>
                  <div className="req-value" style={{ textTransform: 'capitalize' }}>
                    {selectedTransport?.type || req.transportPreference || 'Rail / Flight'}
                  </div>
                </div>

                <div className="req-card">
                  <div className="req-label">
                    <Hotel style={{ width: 14, height: 14 }} /> Accommodation
                  </div>
                  <div className="req-value" style={{ textTransform: 'capitalize' }}>
                    {selectedHotel?.tier || req.accommodationPreference || 'Standard / Verified'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 4: TRANSPORT OPTIONS
             ========================================================================= */}
          {transportList.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-title">
                <Plane style={{ width: 20, height: 20, color: 'var(--primary-500)' }} />
                <span>TRANSPORT OPTIONS</span>
                <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px' }}>
                  DEMO DATA
                </span>
                <span className="badge-counter">{transportList.length} routes</span>
              </div>

              <div className="options-grid">
                {transportList.map((item) => {
                  const isChosen = selectedTransport && selectedTransport.id === item.id;
                  return (
                    <TransportOption
                      key={item.id}
                      item={item}
                      isChosen={isChosen}
                      formatCurrency={formatCurrency}
                      onBook={(chosenItem) => handleBookOption('transport', chosenItem)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 5: HOTEL OPTIONS
             ========================================================================= */}
          {hotelList.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-title">
                <Hotel style={{ width: 20, height: 20, color: 'var(--primary-500)' }} />
                <span>HOTEL OPTIONS</span>
                <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px' }}>
                  DEMO DATA
                </span>
                <span className="badge-counter">{hotelList.length} stays</span>
              </div>

              <div className="options-grid">
                {hotelList.map((item) => {
                  const isChosen = selectedHotel && (selectedHotel.id === item.id || (selectedHotel.hotel && selectedHotel.hotel.id === item.id));
                  return (
                    <HotelOption
                      key={item.id}
                      item={item}
                      isChosen={isChosen}
                      formatCurrency={formatCurrency}
                      onBook={(chosenItem) => handleBookOption('hotel', chosenItem)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 6: STRUCTURED ITINERARY
             ========================================================================= */}
          {itinerary && itinerary.days && itinerary.days.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-title">
                <Calendar style={{ width: 20, height: 20, color: 'var(--primary-500)' }} />
                <span>STRUCTURED ITINERARY</span>
                <span className="badge-counter">{itinerary.days.length} days</span>
              </div>

              {/* Optimization Explanation Quote */}
              {itinerary.summaryExplanation && (
                <div
                  style={{
                    padding: '1.15rem 1.5rem',
                    background: 'rgba(37, 99, 235, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                  }}
                >
                  <Sparkles style={{ width: 20, height: 20, color: '#60a5fa', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#60a5fa', display: 'block', marginBottom: '2px' }}>
                      Agent Optimization Strategy
                    </span>
                    <span style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {itinerary.summaryExplanation}
                    </span>
                  </div>
                </div>
              )}

              <div className="itinerary-days-container">
                {itinerary.days.map((day) => (
                  <div key={day.dayNumber} className="glass-card itinerary-day-card">
                    <div className="itinerary-day-header">
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                          Day {day.dayNumber} • <span style={{ color: 'var(--text-secondary)' }}>{day.city}</span>
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dimmed)' }}>{day.date}</span>
                      </div>

                      <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>
                        Est. Cost: {formatCurrency(day.estimatedCost, planData.currency)}
                      </span>
                    </div>

                    {/* Morning Slot */}
                    {day.morning && day.morning.length > 0 && (
                      <div className="slot-section">
                        <div className="slot-title">
                          <Sunrise style={{ width: 14, height: 14, color: '#f59e0b' }} /> Morning
                        </div>
                        {day.morning.map((act, idx) => (
                          <div key={idx} className="activity-item-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60a5fa', minWidth: '70px' }}>
                                {act.time}
                              </span>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{act.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', marginLeft: '0.5rem' }}>
                                  ({act.duration} mins • {act.category})
                                </span>
                              </div>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: act.cost === 0 ? '#10b981' : 'var(--text-primary)' }}>
                              {act.cost === 0 ? 'Free' : formatCurrency(act.cost, planData.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Afternoon Slot */}
                    {day.afternoon && day.afternoon.length > 0 && (
                      <div className="slot-section">
                        <div className="slot-title">
                          <Sun style={{ width: 14, height: 14, color: '#3b82f6' }} /> Afternoon
                        </div>
                        {day.afternoon.map((act, idx) => (
                          <div key={idx} className="activity-item-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60a5fa', minWidth: '70px' }}>
                                {act.time}
                              </span>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{act.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', marginLeft: '0.5rem' }}>
                                  ({act.duration} mins • {act.category})
                                </span>
                              </div>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: act.cost === 0 ? '#10b981' : 'var(--text-primary)' }}>
                              {act.cost === 0 ? 'Free' : formatCurrency(act.cost, planData.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Evening Slot */}
                    {day.evening && day.evening.length > 0 && (
                      <div className="slot-section" style={{ marginBottom: 0 }}>
                        <div className="slot-title">
                          <Moon style={{ width: 14, height: 14, color: '#a855f7' }} /> Evening
                        </div>
                        {day.evening.map((act, idx) => (
                          <div key={idx} className="activity-item-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60a5fa', minWidth: '70px' }}>
                                {act.time}
                              </span>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{act.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', marginLeft: '0.5rem' }}>
                                  ({act.duration} mins • {act.category})
                                </span>
                              </div>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: act.cost === 0 ? '#10b981' : 'var(--text-primary)' }}>
                              {act.cost === 0 ? 'Free' : formatCurrency(act.cost, planData.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 7: BUDGET & BOOKING SUMMARY
             ========================================================================= */}
          {budget && (budget.breakdown || budget.totalEstimatedCost !== undefined) && (
            <BookingSummary
              budget={budget}
              formatCurrency={formatCurrency}
            />
          )}

          {/* =========================================================================
              SECTION 8: TRIP APPROVAL & MODIFICATION CONTROLS
             ========================================================================= */}
          {planData && planData.itinerary && (
            <div>
              {isApproved ? (
                <div
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <CheckCircle2 style={{ width: 32, height: 32, color: '#10b981', flexShrink: 0 }} />
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginBottom: '0.25rem' }}>
                        Trip Plan Approved!
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        {savingTrip
                          ? 'Adding trip to your GlobeThrottle account...'
                          : savedTripId
                          ? 'AI trip successfully added to GlobeThrottle! Redirecting to your itinerary...'
                          : 'Your AI trip proposal has been approved and saved.'}
                      </p>
                    </div>
                  </div>

                  {savedTripId && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate(`/trips/${savedTripId}/itinerary`)}
                      style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <span>View in Itinerary</span>
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="plan-actions-bar">
                  <button
                    type="button"
                    onClick={handleApproveTrip}
                    className="btn btn-primary"
                    style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', backgroundColor: '#10b981' }}
                  >
                    <CheckCircle2 style={{ width: 18, height: 18 }} />
                    <span>Approve Trip</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleModifyPlan}
                    className="btn btn-secondary"
                    style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}
                  >
                    <RotateCcw style={{ width: 18, height: 18 }} />
                    <span>Modify Plan</span>
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
