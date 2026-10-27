import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
  X,
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
  const [selectedTransportId, setSelectedTransportId] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [isStalePlan, setIsStalePlan] = useState(false);
  const [modifyForm, setModifyForm] = useState({
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    durationDays: 3,
    travelers: 1,
    budget: '',
    currency: 'INR',
    interests: '',
    transportPreference: 'any',
    accommodationPreference: 'any',
    stops: '',
    specialRequirements: '',
    formError: '',
  });
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
    setSelectedTransportId(null);
    setSelectedHotelId(null);
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

  const handleOpenModifyModal = () => {
    const req = planData?.requirements || {};
    setModifyForm({
      origin: req.origin || '',
      destination: (Array.isArray(req.destinations) && req.destinations[0]) || req.destination || '',
      startDate: req.startDate || '',
      endDate: req.endDate || '',
      durationDays: req.durationDays || 3,
      travelers: req.travelers || 1,
      budget: req.budget !== null && req.budget !== undefined ? req.budget : '',
      currency: req.currency || 'INR',
      interests: Array.isArray(req.interests) ? req.interests.join(', ') : (req.interests || ''),
      transportPreference: req.transportPreference || 'any',
      accommodationPreference: req.accommodationPreference || 'any',
      stops: Array.isArray(req.stops) ? req.stops.join(', ') : (req.stops || ''),
      specialRequirements: Array.isArray(req.specialRequirements) ? req.specialRequirements.join(', ') : '',
      formError: '',
    });
    setIsModifyModalOpen(true);
  };

  const handleCloseModifyModal = () => {
    setIsModifyModalOpen(false);
  };

  const handleSaveRequirements = (e) => {
    if (e) e.preventDefault();
    if (!modifyForm.destination.trim()) {
      setModifyForm((prev) => ({ ...prev, formError: 'Destination city is required' }));
      return;
    }

    const updatedReq = {
      ...(planData?.requirements || {}),
      origin: modifyForm.origin.trim() || null,
      destination: modifyForm.destination.trim(),
      destinations: [modifyForm.destination.trim()],
      startDate: modifyForm.startDate || null,
      endDate: modifyForm.endDate || null,
      durationDays: Number(modifyForm.durationDays) || 3,
      travelers: Number(modifyForm.travelers) || 1,
      budget: modifyForm.budget !== '' ? Number(modifyForm.budget) : null,
      currency: modifyForm.currency,
      interests: modifyForm.interests ? modifyForm.interests.split(',').map((s) => s.trim()).filter(Boolean) : [],
      stops: modifyForm.stops ? modifyForm.stops.split(',').map((s) => s.trim()).filter(Boolean) : [],
      transportPreference: modifyForm.transportPreference !== 'any' ? modifyForm.transportPreference : null,
      accommodationPreference: modifyForm.accommodationPreference !== 'any' ? modifyForm.accommodationPreference : null,
    };

    setPlanData((prev) => ({
      ...prev,
      requirements: updatedReq,
    }));
    setIsStalePlan(true);
    setIsApproved(false);
    setIsModifyModalOpen(false);
  };

  const handleRegeneratePlan = async (e) => {
    if (e) e.preventDefault();
    if (!modifyForm.destination.trim()) {
      setModifyForm((prev) => ({ ...prev, formError: 'Destination city is required' }));
      return;
    }

    const formulatedPrompt = `Plan a ${modifyForm.durationDays || 3} day trip to ${modifyForm.destination.trim()}${modifyForm.origin.trim() ? ` from ${modifyForm.origin.trim()}` : ''} for ${modifyForm.travelers || 1} people with budget of ${modifyForm.currency || 'INR'} ${modifyForm.budget || 20000}`.trim();

    const updatedPreferences = {
      origin: modifyForm.origin.trim() || null,
      destination: modifyForm.destination.trim(),
      destinations: [modifyForm.destination.trim()],
      startDate: modifyForm.startDate || null,
      endDate: modifyForm.endDate || null,
      durationDays: Number(modifyForm.durationDays) || 3,
      travelers: Number(modifyForm.travelers) || 1,
      budget: modifyForm.budget !== '' ? Number(modifyForm.budget) : null,
      currency: modifyForm.currency,
      interests: modifyForm.interests ? modifyForm.interests.split(',').map((s) => s.trim()).filter(Boolean) : [],
      stops: modifyForm.stops ? modifyForm.stops.split(',').map((s) => s.trim()).filter(Boolean) : [],
      transportPreference: modifyForm.transportPreference !== 'any' ? modifyForm.transportPreference : null,
      accommodationPreference: modifyForm.accommodationPreference !== 'any' ? modifyForm.accommodationPreference : null,
    };

    setIsModifyModalOpen(false);
    setMessage(formulatedPrompt);
    setLoading(true);
    setError('');
    setIsApproved(false);
    setSavedTripId(null);
    setSelectedTransportId(null);
    setSelectedHotelId(null);
    setActiveStageIndex(0);

    if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    stageTimerRef.current = setInterval(() => {
      setActiveStageIndex((prev) => (prev < STAGES.length - 2 ? prev + 1 : prev));
    }, 800);

    try {
      const response = await planTripWithAgent({
        message: formulatedPrompt,
        preferences: updatedPreferences,
      });

      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      setActiveStageIndex(STAGES.length - 1);

      if (response.status === 'needs_input' || response.requiresUserInput) {
        setMissingInfo(response.missingInformation || ['destination']);
        setWarningMessage(response.message || 'Additional parameters needed.');
        setPlanData(response);
      } else if (response.success) {
        setPlanData(response);
        setIsStalePlan(false);
        setMissingInfo([]);
        setWarningMessage('');
        setTimeout(() => {
          if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      } else {
        setError(response.message || 'Failed to regenerate plan.');
      }
    } catch (err) {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      setError(err.message || 'Error regenerating plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleModifyPlan = () => {
    handleOpenModifyModal();
  };

  const handleRegenerateWithinBudget = async () => {
    const req = planData?.requirements || {};
    const dest = (Array.isArray(req.destinations) && req.destinations[0]) || req.destination || '';
    const dur = req.durationDays || 3;
    const trav = req.travelers || 1;
    const bgt = req.budget || 20000;
    const curr = req.currency || 'INR';

    const optimizedPrompt = `Plan a ${dur}-day trip to ${dest}${req.origin ? ` from ${req.origin}` : ''} for ${trav} people within budget of ${curr} ${bgt}. Optimize activities and stay to fit strictly within budget.`;

    const updatedPreferences = {
      ...req,
      destination: dest,
      destinations: [dest],
      durationDays: dur,
      travelers: trav,
      budget: bgt,
      currency: curr,
      accommodationPreference: req.accommodationPreference === 'luxury' ? 'standard' : (req.accommodationPreference || 'budget'),
    };

    setMessage(optimizedPrompt);
    setLoading(true);
    setError('');
    setIsApproved(false);
    setSavedTripId(null);
    setSelectedTransportId(null);
    setSelectedHotelId(null);
    setActiveStageIndex(0);

    if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    stageTimerRef.current = setInterval(() => {
      setActiveStageIndex((prev) => (prev < STAGES.length - 2 ? prev + 1 : prev));
    }, 800);

    try {
      const response = await planTripWithAgent({
        message: optimizedPrompt,
        preferences: updatedPreferences,
      });

      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      setActiveStageIndex(STAGES.length - 1);

      if (response.status === 'needs_input' || response.requiresUserInput) {
        setMissingInfo(response.missingInformation || ['destination']);
        setWarningMessage(response.message || 'Additional parameters needed.');
        setPlanData(response);
      } else if (response.success) {
        setPlanData(response);
        setIsStalePlan(false);
        setMissingInfo([]);
        setWarningMessage('');
        setTimeout(() => {
          if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      } else {
        setError(response.message || 'Failed to regenerate plan.');
      }
    } catch (err) {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      setError(err.message || 'Error regenerating plan within budget.');
    } finally {
      setLoading(false);
    }
  };

  const renderActivityCostBadge = (act) => {
    const isFree = !act.cost || act.cost === 0;
    if (isFree) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            fontWeight: 700,
            fontSize: '0.8rem',
          }}
        >
          Free Entry
        </span>
      );
    }

    const travelerCount = planData?.requirements?.travelers || planData?.travelers || 1;
    const isPerPerson = act.pricePerPerson !== false;

    return (
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          {formatCurrency(act.cost, planData?.currency || 'INR')}
          {isPerPerson && travelerCount > 1 ? (
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}> / person</span>
          ) : null}
        </span>
        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dimmed)' }}>
          {act.pricingType === 'verified'
            ? 'Verified Ticket'
            : act.pricingType === 'entry_fee'
            ? 'Est. Entry Fee'
            : 'Est. Price'}
        </span>
      </div>
    );
  };

  const handleApproveTrip = async () => {
    if (!planData) return;

    if (isStalePlan) {
      setError('Trip requirements have been changed. Please click "Regenerate Plan" to update the itinerary and budget before approving.');
      return;
    }

    if (planData?.budget?.withinBudget === false && planData?.budget?.budget > 0) {
      setError(`Cannot approve: Trip estimate exceeds your budget ceiling of ${formatCurrency(planData.budget.budget, planData.currency || 'INR')}. Please click "Regenerate Within Budget" or adjust requirements before approving.`);
      return;
    }

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

  const handlePayAndApprove = async () => {
    if (isStalePlan) {
      setError('Trip requirements have been changed. Please click "Regenerate Plan" before proceeding to payment.');
      return;
    }

    if (planData?.budget?.withinBudget === false && planData?.budget?.budget > 0) {
      setError(`Cannot proceed: Trip estimate exceeds your budget ceiling of ${formatCurrency(planData.budget.budget, planData.currency || 'INR')}. Please click "Regenerate Within Budget" or adjust requirements.`);
      return;
    }

    let tripId = savedTripId;
    if (!tripId) {
      try {
        setSavingTrip(true);
        setError('');
        const approveRes = await approveTripPlan(planData);
        if (approveRes && approveRes.success && approveRes.tripId) {
          tripId = approveRes.tripId;
          setSavedTripId(tripId);
        }
      } catch (err) {
        if (err.tripId) {
          tripId = err.tripId;
          setSavedTripId(tripId);
        } else {
          setError(err.message || 'Please review your trip plan before proceeding to payment');
          setSavingTrip(false);
          return;
        }
      } finally {
        setSavingTrip(false);
      }
    }

    if (tripId) {
      if (selectedTransport || selectedHotel) {
        try {
          setLoading(true);
          const bookingType = selectedTransport && selectedHotel ? 'package' : selectedTransport ? 'transport' : 'hotel';
          const res = await prepareBooking({
            tripId,
            type: bookingType,
            transportOptionId: selectedTransport?.id || selectedTransport?.trainNumber,
            hotelOptionId: selectedHotel?.id || (selectedHotel?.hotel && selectedHotel.hotel.id),
            optionId: selectedTransport?.id || selectedHotel?.id,
          });

          if (res && res.success && res.booking) {
            navigate(`/booking/${res.booking.bookingId || res.booking.bookingReference}`);
          }
        } catch (err) {
          setError(err.message || 'Failed to prepare complete trip payment');
        } finally {
          setLoading(false);
        }
      } else {
        setIsApproved(true);
        navigate(`/trips/${tripId}/itinerary`);
      }
    }
  };

  const handleBookPackage = handlePayAndApprove;

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

  const selectedTransport = (transportList.length > 0 && selectedTransportId
    ? transportList.find((t) => t.id === selectedTransportId)
    : null) || planData?.selectedOptions?.transport || (transportList.length > 0 ? transportList[0] : null);

  const selectedHotel = (hotelList.length > 0 && selectedHotelId
    ? hotelList.find((h) => h.id === selectedHotelId || (h.hotel && h.hotel.id === selectedHotelId))
    : null) || planData?.selectedOptions?.hotel || (hotelList.length > 0 ? hotelList[0] : null);

  const travelersCount = planData?.requirements?.travelers || planData?.travelers || 1;
  const transportTotalCost = selectedTransport
    ? (selectedTransport.totalRoundTripCost || selectedTransport.totalRoundTripPrice || ((selectedTransport.pricePerPerson || selectedTransport.price || selectedTransport.cost || 0) * (selectedTransport.roundTripMultiplier || 2) * (selectedTransport.travelers || travelersCount)))
    : 0;
  const hotelTotalCost = selectedHotel ? (selectedHotel.totalStayCost || selectedHotel.totalCost || 0) : 0;
  const combinedPackageCost = transportTotalCost + hotelTotalCost;
  const executionLog = planData?.agent?.executionLog || [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
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
            <h1 className="editorial-display" style={{ fontSize: '2.6rem', fontWeight: 800, marginBottom: '0.65rem' }}>
              AI <span className="gradient-text">Trip Planner</span>
            </h1>
            <p style={{ maxWidth: '660px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
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
            <div ref={resultsRef} style={{ marginBottom: '2rem' }}>
              <div className="ai-review-banner glass-card">
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
                    <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {planData.isFallback || planData.aiDiagnostics?.isFallback ? (
                        <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          ⚡ Simulation Mode (Deterministic Rule Engine)
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          ✨ Live AI Model ({planData.aiDiagnostics?.provider || 'OpenAI'} / {planData.aiDiagnostics?.model || 'gpt-4o-mini'})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isApproved ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const el = document.getElementById('trip-checkout-action');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    disabled={isStalePlan}
                    title={isStalePlan ? 'Please regenerate plan before proceeding' : 'Scroll down to Pay & Approve Trip'}
                    style={{
                      padding: '0.65rem 1.4rem',
                      fontSize: '0.95rem',
                      backgroundColor: isStalePlan ? '#6b7280' : 'var(--primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontWeight: 700,
                      cursor: isStalePlan ? 'not-allowed' : 'pointer',
                      opacity: isStalePlan ? 0.7 : 1,
                    }}
                  >
                    <CreditCard style={{ width: 16, height: 16 }} />
                    <span>Pay to Approve ↓</span>
                  </button>
                ) : (
                  <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                    ✓ Trip Approved &amp; Paid
                  </span>
                )}
              </div>

              {/* Stale Plan Notice */}
              {isStalePlan && (
                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.85rem 1.25rem',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <AlertTriangle style={{ width: 20, height: 20, color: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600 }}>
                      Trip requirements have changed! You must regenerate the plan before approving to update the schedule and budget.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleOpenModifyModal}
                    style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#FEF5EE', fontWeight: 700, padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', border: 'none', boxShadow: '0 2px 8px rgba(217, 119, 6, 0.35)' }}
                  >
                    <RefreshCw style={{ width: 14, height: 14 }} />
                    <span>Regenerate Plan</span>
                  </button>
                </div>
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
              <div className="ai-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <MapPin style={{ width: 20, height: 20, color: 'var(--primary-500)' }} />
                  <span>TRIP REQUIREMENTS</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleOpenModifyModal}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
                >
                  <Sliders style={{ width: 14, height: 14 }} />
                  <span>Edit Requirements</span>
                </button>
              </div>

              <div className="req-grid">
                <div className="req-card">
                  <div className="req-label">
                    <Plane style={{ width: 14, height: 14 }} /> Origin
                  </div>
                  <div className="req-value">
                    {req.origin || 'Flexible / Not specified'}
                  </div>
                </div>

                <div className="req-card">
                  <div className="req-label">
                    <MapPin style={{ width: 14, height: 14 }} /> Destination
                  </div>
                  <div className="req-value">
                    {req.destinations.join(', ')}
                  </div>
                </div>

                {req.stops && req.stops.length > 0 && (
                  <div className="req-card">
                    <div className="req-label">
                      <MapPin style={{ width: 14, height: 14 }} /> Additional Stops
                    </div>
                    <div className="req-value">
                      {req.stops.join(', ')}
                    </div>
                  </div>
                )}

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
          {planData && (
            <div className="ai-section">
              <div className="ai-section-title">
                <Train style={{ width: 20, height: 20, color: 'var(--primary-500)' }} />
                <span>TRANSPORT OPTIONS</span>
                <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px' }}>
                  DEMO DATA
                </span>
                <span className="badge-counter">{transportList.length} routes</span>
              </div>

              {transportList.length > 0 ? (
                <div className="options-grid">
                  {transportList.map((item) => {
                    const isChosen = selectedTransport && selectedTransport.id === item.id;
                    return (
                      <TransportOption
                        key={item.id}
                        item={item}
                        isChosen={isChosen}
                        formatCurrency={formatCurrency}
                        onSelect={(chosenItem) => setSelectedTransportId(chosenItem.id)}
                        onBook={(chosenItem) => setSelectedTransportId(chosenItem.id)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div
                  className="glass-card"
                  style={{
                    padding: '1.75rem 2rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(30, 41, 59, 0.45)',
                    border: '1px dashed rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ef4444',
                      flexShrink: 0,
                    }}
                  >
                    <Train style={{ width: 28, height: 28 }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Train Not Available
                      </h4>
                      <span className="badge badge-danger" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                        No Direct Route
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      No direct demo trains found for{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>{req.origin || 'your origin'}</strong> →{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>{req.destinations?.[0] || 'destination'}</strong>.
                      Consider connecting trains, flights, or local road transfers.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              SECTION 5: HOTEL OPTIONS
             ========================================================================= */}
          {planData && (
            <div className="ai-section">
              <div className="ai-section-title">
                <Hotel style={{ width: 20, height: 20, color: 'var(--primary-500)' }} />
                <span>HOTEL OPTIONS</span>
                <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px' }}>
                  DEMO DATA
                </span>
                <span className="badge-counter">{hotelList.length} stays</span>
              </div>

              {hotelList.length > 0 ? (
                <div className="options-grid">
                  {hotelList.map((item) => {
                    const isChosen = selectedHotel && (selectedHotel.id === item.id || (selectedHotel.hotel && selectedHotel.hotel.id === item.id));
                    return (
                      <HotelOption
                        key={item.id}
                        item={item}
                        isChosen={isChosen}
                        formatCurrency={formatCurrency}
                        onSelect={(chosenItem) => setSelectedHotelId(chosenItem.id || chosenItem.hotel?.id)}
                        onBook={(chosenItem) => setSelectedHotelId(chosenItem.id || chosenItem.hotel?.id)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div
                  className="glass-card"
                  style={{
                    padding: '1.75rem 2rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(30, 41, 59, 0.45)',
                    border: '1px dashed rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ef4444',
                      flexShrink: 0,
                    }}
                  >
                    <Hotel style={{ width: 28, height: 28 }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Hotel Not Available
                      </h4>
                      <span className="badge badge-danger" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                        No Demo Inventory
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      No verified demo stays found for{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>{req.destinations?.[0] || 'destination'}</strong>.
                      Please check nearby locations or adjust your accommodation filter.
                    </p>
                  </div>
                </div>
              )}
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
                            {renderActivityCostBadge(act)}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Afternoon Slot */}
                    {day.afternoon && day.afternoon.length > 0 && (
                      <div className="slot-section">
                        <div className="slot-title">
                          <Sun style={{ width: 14, height: 14, color: 'var(--primary)' }} /> Afternoon
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
                            {renderActivityCostBadge(act)}
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
                            {renderActivityCostBadge(act)}
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
              onBookPackage={handleBookPackage}
              onRegenerateWithinBudget={handleRegenerateWithinBudget}
              packageCost={combinedPackageCost}
              hasSelectedPackage={Boolean(selectedTransport || selectedHotel)}
              selectedTransportName={selectedTransport ? (selectedTransport.carrier || selectedTransport.name) : null}
              selectedHotelName={selectedHotel ? (selectedHotel.name || (selectedHotel.hotel && selectedHotel.hotel.name)) : null}
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
                  {/* Single Checkout & Approval Action */}
                  <button
                    id="trip-checkout-action"
                    type="button"
                    onClick={handlePayAndApprove}
                    disabled={loading || savingTrip || isStalePlan}
                    className="btn btn-primary"
                    title={isStalePlan ? 'Please click Regenerate Plan first' : 'Pay for trip and approve'}
                    style={{
                      padding: '0.95rem 2.5rem',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      background: isStalePlan ? '#6b7280' : 'var(--gradient-primary)',
                      color: '#FEF5EE',
                      boxShadow: '0 6px 20px rgba(69, 87, 153, 0.45)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      cursor: (loading || savingTrip || isStalePlan) ? 'not-allowed' : 'pointer',
                      opacity: (loading || savingTrip || isStalePlan) ? 0.7 : 1,
                    }}
                  >
                    <CreditCard style={{ width: 20, height: 20 }} />
                    <span>Pay &amp; Approve Trip ({formatCurrency(combinedPackageCost, planData?.currency || 'INR')})</span>
                    <ArrowRight style={{ width: 18, height: 18 }} />
                  </button>

                  {budget?.withinBudget === false && (
                    <button
                      type="button"
                      onClick={handleRegenerateWithinBudget}
                      disabled={loading || savingTrip}
                      className="btn btn-primary"
                      style={{
                        padding: '0.85rem 2rem',
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#fff',
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <RefreshCw style={{ width: 18, height: 18 }} />
                      <span>Regenerate Within Budget</span>
                    </button>
                  )}

                  {isStalePlan && (
                    <button
                      type="button"
                      onClick={handleOpenModifyModal}
                      className="btn btn-primary"
                      style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#FEF5EE', fontWeight: 700, border: 'none', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)' }}
                    >
                      <RefreshCw style={{ width: 18, height: 18 }} />
                      <span>Regenerate Plan</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleModifyPlan}
                    className="btn btn-secondary"
                    style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(16, 24, 47, 0.08)' }}
                  >
                    <RotateCcw style={{ width: 18, height: 18 }} />
                    <span>Modify Plan</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODAL: MODIFY PLAN / EDIT REQUIREMENTS
             ========================================================================= */}
          {isModifyModalOpen && (
            <div className="modal-overlay" onClick={handleCloseModifyModal}>
              <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>
                    <Sliders style={{ width: 22, height: 22, color: 'var(--primary-500)' }} />
                    <span>Modify Trip Plan Requirements</span>
                  </h3>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={handleCloseModifyModal}
                    aria-label="Close"
                  >
                    <X style={{ width: 20, height: 20 }} />
                  </button>
                </div>

                {modifyForm.formError && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#f87171',
                      marginBottom: '1.25rem',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <AlertTriangle style={{ width: 16, height: 16 }} />
                    <span>{modifyForm.formError}</span>
                  </div>
                )}

                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="modal-form-grid">
                    {/* Origin */}
                    <div className="modal-field">
                      <label className="modal-label">
                        <Plane style={{ width: 14, height: 14 }} /> Departure Origin
                      </label>
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="e.g. Vadodara, Ahmedabad, Mumbai"
                        value={modifyForm.origin}
                        onChange={(e) => setModifyForm({ ...modifyForm, origin: e.target.value })}
                      />
                    </div>

                    {/* Destination */}
                    <div className="modal-field">
                      <label className="modal-label">
                        <MapPin style={{ width: 14, height: 14 }} /> Primary Destination *
                      </label>
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="e.g. Kashmir, Goa, Jaipur"
                        required
                        value={modifyForm.destination}
                        onChange={(e) => setModifyForm({ ...modifyForm, destination: e.target.value })}
                      />
                    </div>

                    {/* Additional Stops */}
                    <div className="modal-field full-width">
                      <label className="modal-label">
                        <MapPin style={{ width: 14, height: 14 }} /> Additional Stops or Day-Trips (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="e.g. Gulmarg, Pahalgam, Sonamarg"
                        value={modifyForm.stops}
                        onChange={(e) => setModifyForm({ ...modifyForm, stops: e.target.value })}
                      />
                    </div>

                    {/* Start Date */}
                    <div className="modal-field">
                      <label className="modal-label">
                        <Calendar style={{ width: 14, height: 14 }} /> Start Date
                      </label>
                      <input
                        type="date"
                        className="modal-input"
                        value={modifyForm.startDate}
                        onChange={(e) => setModifyForm({ ...modifyForm, startDate: e.target.value })}
                      />
                    </div>

                    {/* End Date */}
                    <div className="modal-field">
                      <label className="modal-label">
                        <Calendar style={{ width: 14, height: 14 }} /> End Date
                      </label>
                      <input
                        type="date"
                        className="modal-input"
                        value={modifyForm.endDate}
                        onChange={(e) => setModifyForm({ ...modifyForm, endDate: e.target.value })}
                      />
                    </div>

                    {/* Duration Days */}
                    <div className="modal-field">
                      <label className="modal-label">
                        <Clock style={{ width: 14, height: 14 }} /> Duration (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        className="modal-input"
                        value={modifyForm.durationDays}
                        onChange={(e) => setModifyForm({ ...modifyForm, durationDays: e.target.value })}
                      />
                    </div>

                    {/* Travelers */}
                    <div className="modal-field">
                      <label className="modal-label">
                        <Users style={{ width: 14, height: 14 }} /> Travelers (People)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        className="modal-input"
                        value={modifyForm.travelers}
                        onChange={(e) => setModifyForm({ ...modifyForm, travelers: e.target.value })}
                      />
                    </div>

                    {/* Budget */}
                    <div className="modal-field">
                      <label className="modal-label">
                        <CreditCard style={{ width: 14, height: 14 }} /> Budget Limit
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="modal-input"
                        placeholder="e.g. 20000"
                        value={modifyForm.budget}
                        onChange={(e) => setModifyForm({ ...modifyForm, budget: e.target.value })}
                      />
                    </div>

                    {/* Currency */}
                    <div className="modal-field">
                      <label className="modal-label">
                        <DollarSign style={{ width: 14, height: 14 }} /> Currency
                      </label>
                      <select
                        className="modal-select"
                        value={modifyForm.currency}
                        onChange={(e) => setModifyForm({ ...modifyForm, currency: e.target.value })}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    {/* Interests */}
                    <div className="modal-field full-width">
                      <label className="modal-label">
                        <Tag style={{ width: 14, height: 14 }} /> Interests & Vibes (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="e.g. Nature, Historic monuments, Local food, Adventure"
                        value={modifyForm.interests}
                        onChange={(e) => setModifyForm({ ...modifyForm, interests: e.target.value })}
                      />
                    </div>

                    {/* Transport Preference */}
                    <div className="modal-field">
                      <label className="modal-label">
                        <Train style={{ width: 14, height: 14 }} /> Transport Preference
                      </label>
                      <select
                        className="modal-select"
                        value={modifyForm.transportPreference}
                        onChange={(e) => setModifyForm({ ...modifyForm, transportPreference: e.target.value })}
                      >
                        <option value="any">Flexible / Any Mode</option>
                        <option value="flight">Flight</option>
                        <option value="train">Train</option>
                        <option value="bus">Bus</option>
                        <option value="self-drive">Self-drive</option>
                      </select>
                    </div>

                    {/* Accommodation Preference */}
                    <div className="modal-field">
                      <label className="modal-label">
                        <Hotel style={{ width: 14, height: 14 }} /> Accommodation Preference
                      </label>
                      <select
                        className="modal-select"
                        value={modifyForm.accommodationPreference}
                        onChange={(e) => setModifyForm({ ...modifyForm, accommodationPreference: e.target.value })}
                      >
                        <option value="any">Any / Balanced</option>
                        <option value="budget">Budget / Hostel</option>
                        <option value="mid-range">Mid-Range / Boutique</option>
                        <option value="luxury">Luxury / 5-Star Resort</option>
                      </select>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseModifyModal}
                      style={{ padding: '0.65rem 1.25rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleSaveRequirements}
                      style={{ padding: '0.65rem 1.25rem' }}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleRegeneratePlan}
                      style={{ padding: '0.65rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                    >
                      <RefreshCw style={{ width: 15, height: 15 }} />
                      <span>Regenerate Plan</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
