import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getItineraryApi,
  addActivityToStopApi,
  updateActivityApi,
  deleteActivityApi,
} from '../services/api';
import Navbar from '../components/Navbar';
import CalendarGrid from '../components/CalendarGrid';
import ActivityModal from '../components/ActivityModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  DollarSign,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  Tag,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function TripCalendar() {
  const { id } = useParams();
  const [itinerary, setItinerary] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [expandedDays, setExpandedDays] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  // Activity Modal States
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Delete Activity Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchItinerary = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getItineraryApi(id);
      if (response.success) {
        setItinerary(response);
        if (response.days && response.days.length > 0) {
          setSelectedDate(response.days[0].date);
          // Initialize all days expanded for mobile stream view
          const initialExpanded = {};
          response.days.forEach((d) => (initialExpanded[d.dayNumber] = true));
          setExpandedDays(initialExpanded);
        }
      }
    } catch (err) {
      console.error('[TripCalendar fetch error]:', err);
      setError(err.message || 'Failed to load trip calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchItinerary();
  }, [id]);

  const showFeedback = (msg) => {
    setSaveFeedback(msg);
    setTimeout(() => setSaveFeedback(''), 3000);
  };

  // Find active selected day object
  const selectedDayObj = itinerary?.days?.find((d) => d.date === selectedDate) || itinerary?.days?.[0];

  // Navigate to Previous/Next Day
  const handlePrevDay = () => {
    if (!itinerary?.days) return;
    const currentIndex = itinerary.days.findIndex((d) => d.date === selectedDate);
    if (currentIndex > 0) {
      setSelectedDate(itinerary.days[currentIndex - 1].date);
    }
  };

  const handleNextDay = () => {
    if (!itinerary?.days) return;
    const currentIndex = itinerary.days.findIndex((d) => d.date === selectedDate);
    if (currentIndex < itinerary.days.length - 1) {
      setSelectedDate(itinerary.days[currentIndex + 1].date);
    }
  };

  const toggleDayExpand = (dayNumber) => {
    setExpandedDays((prev) => ({ ...prev, [dayNumber]: !prev[dayNumber] }));
  };

  // Submit Activity Form
  const handleActivitySubmit = async (formData) => {
    setModalSubmitting(true);
    try {
      if (editingActivity) {
        const res = await updateActivityApi(id, editingActivity._id, formData);
        if (res.success) {
          showFeedback('Activity updated');
          fetchItinerary();
        }
      } else {
        const res = await addActivityToStopApi(id, formData.stopId, formData);
        if (res.success) {
          showFeedback('Activity scheduled');
          fetchItinerary();
        }
      }
      setIsActivityModalOpen(false);
      setEditingActivity(null);
    } catch (err) {
      console.error('[Activity submit error]:', err);
      alert(err.message || 'Failed to save activity');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete Activity
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await deleteActivityApi(id, deleteTarget._id);
      if (res.success) {
        showFeedback('Activity removed');
        fetchItinerary();
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('[Delete activity error]:', err);
      alert(err.message || 'Failed to remove activity');
    } finally {
      setDeleting(false);
    }
  };

  const formatDateHeader = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (mins) => {
    if (!mins) return '60 mins';
    if (mins >= 60) {
      const h = (mins / 60).toFixed(1);
      return `${h.endsWith('.0') ? parseInt(h) : h} hrs`;
    }
    return `${mins} mins`;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container">

          {/* Navigation & Header */}
          <div className="flex flex-col flex-md-row justify-between items-start items-md-center gap-4" style={{ marginBottom: '2rem' }}>
            <div>
              <Link to={`/trips/${id}`} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                <ArrowLeft style={{ width: 16, height: 16 }} />
                <span>Back to Trip Overview</span>
              </Link>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>
                {itinerary?.trip?.name || 'Trip Calendar'} — Visual Timeline
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Calendar view & chronological vertical timeline stream
              </p>
            </div>

            <button
              onClick={() => {
                setEditingActivity(null);
                setIsActivityModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              <Plus style={{ width: 18, height: 18 }} />
              <span>Add Activity</span>
            </button>
          </div>

          {/* Feedback Banner */}
          {saveFeedback && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <CheckCircle2 style={{ width: 18, height: 18 }} />
              <span>{saveFeedback}</span>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle style={{ width: 20, height: 20 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading ? (
            <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Compass className="pulse-glow" style={{ width: 44, height: 44, color: '#3b82f6', margin: '0 auto 1rem auto' }} />
              <p style={{ fontFamily: 'var(--font-heading)' }}>Loading visual calendar...</p>
            </div>
          ) : itinerary ? (
            <div className="calendar-responsive-grid">

              {/* Left Column: Interactive Calendar Grid */}
              <div>
                <CalendarGrid
                  days={itinerary.days || []}
                  selectedDate={selectedDate}
                  onSelectDate={(dateStr) => setSelectedDate(dateStr)}
                  tripStartDate={itinerary.trip?.startDate}
                  tripEndDate={itinerary.trip?.endDate}
                />
              </div>

              {/* Right Column: Selected Day Vertical Timeline Stream */}
              <div>
                <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Selected Day Header & Day Navigation */}
                  <div className="flex justify-between items-center" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Selected Day Itinerary
                      </span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                        {selectedDayObj ? `Day ${selectedDayObj.dayNumber}` : 'Select Date'}
                      </h3>
                      {selectedDayObj && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {formatDateHeader(selectedDayObj.date)}
                        </div>
                      )}
                    </div>

                    {/* Day Navigation Prev/Next */}
                    <div className="flex items-center gap-2">
                      <button onClick={handlePrevDay} className="btn btn-secondary" style={{ padding: '0.35rem 0.55rem' }} title="Previous Day">
                        <ChevronLeft style={{ width: 16, height: 16 }} />
                      </button>
                      <button onClick={handleNextDay} className="btn btn-secondary" style={{ padding: '0.35rem 0.55rem' }} title="Next Day">
                        <ChevronRight style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </div>

                  {/* Active Destination Stop Badge */}
                  {selectedDayObj?.stop && (
                    <div className="flex items-center gap-2" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-glow)' }}>
                      <MapPin style={{ width: 16, height: 16, color: '#34d399' }} />
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedDayObj.stop.city}, {selectedDayObj.stop.country}
                      </span>
                    </div>
                  )}

                  {/* Chronological Vertical Timeline Stream */}
                  <div style={{ flex: 1, position: 'relative', paddingLeft: '1.75rem' }}>
                    <div style={{ position: 'absolute', left: '8px', top: '4px', bottom: '4px', width: '2px', backgroundColor: '#2563eb' }} />

                    {selectedDayObj?.activities && selectedDayObj.activities.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {selectedDayObj.activities.map((act) => (
                          <div key={act._id} style={{ position: 'relative' }}>
                            {/* Timeline Point Dot */}
                            <div style={{ position: 'absolute', left: '-1.75rem', top: '14px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#60a5fa', border: '2px solid #0b0f19', transform: 'translateX(-50%)' }} />

                            <div className="glass-card" style={{ padding: '0.9rem 1.1rem', background: 'rgba(255, 255, 255, 0.03)' }}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                      {act.time}
                                    </span>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                      {act.name}
                                    </h4>
                                  </div>

                                  {act.description && (
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                                      {act.description}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-3" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                                    <span>Duration: {formatDuration(act.duration)}</span>
                                    <span style={{ color: '#34d399', fontWeight: 600 }}>${act.cost || 0}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingActivity(act);
                                      setIsActivityModalOpen(true);
                                    }}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                                  >
                                    <Edit3 style={{ width: 12, height: 12 }} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(act)}
                                    className="btn"
                                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                                  >
                                    <Trash2 style={{ width: 12, height: 12 }} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                        <Clock style={{ width: 32, height: 32, color: 'var(--text-dimmed)', margin: '0 auto 0.75rem auto' }} />
                        <p style={{ fontSize: '0.88rem' }}>No activities scheduled for this date.</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          ) : null}

        </div>
      </main>

      {/* Activity Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setEditingActivity(null);
        }}
        onSubmit={handleActivitySubmit}
        stops={itinerary?.stops || []}
        initialData={editingActivity}
        loading={modalSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove Activity"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from this itinerary date?`}
        confirmText="Remove Activity"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
