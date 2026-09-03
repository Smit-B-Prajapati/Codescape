import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getItineraryApi,
  addActivityToStopApi,
  updateActivityApi,
  deleteActivityApi,
} from '../services/api';
import Navbar from '../components/Navbar';
import ActivityModal from '../components/ActivityModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  List,
  Clock,
  Calendar,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  DollarSign,
  ArrowLeft,
  Compass,
  Tag,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';

export default function ItineraryBuilder() {
  const { id } = useParams();
  const [itinerary, setItinerary] = useState(null);
  const [activeView, setActiveView] = useState('list'); // 'list' | 'timeline'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  // Activity Form Modal States
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
      }
    } catch (err) {
      console.error('[Itinerary fetch error]:', err);
      setError(err.message || 'Failed to load itinerary builder');
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

  // Submit Add or Edit Activity
  const handleActivitySubmit = async (formData) => {
    setModalSubmitting(true);
    try {
      if (editingActivity) {
        const res = await updateActivityApi(id, editingActivity._id, formData);
        if (res.success) {
          showFeedback('Activity updated successfully');
          fetchItinerary();
        }
      } else {
        const res = await addActivityToStopApi(id, formData.stopId, formData);
        if (res.success) {
          showFeedback('New activity added to itinerary');
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
                {itinerary?.trip?.name || 'Itinerary Builder'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Day-by-day activity timeline & multi-city schedule planning
              </p>
            </div>

            {/* View Switcher Tabs & Add Activity CTA */}
            <div className="flex items-center gap-3">
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={() => setActiveView('list')}
                  className="btn"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: activeView === 'list' ? '#2563eb' : 'transparent',
                    color: activeView === 'list' ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                  }}
                >
                  <List style={{ width: 14, height: 14 }} />
                  <span>List View</span>
                </button>

                <button
                  onClick={() => setActiveView('timeline')}
                  className="btn"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: activeView === 'timeline' ? '#2563eb' : 'transparent',
                    color: activeView === 'timeline' ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                  }}
                >
                  <Clock style={{ width: 14, height: 14 }} />
                  <span>Timeline View</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setEditingActivity(null);
                  setIsActivityModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.1rem' }}
              >
                <Plus style={{ width: 16, height: 16 }} />
                <span>Add Activity</span>
              </button>
            </div>
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
              <p style={{ fontFamily: 'var(--font-heading)' }}>Generating day-by-day itinerary...</p>
            </div>
          ) : itinerary ? (
            <div>

              {/* 1. LIST VIEW */}
              {activeView === 'list' && (
                <div className="flex flex-col gap-6">
                  {itinerary.days && itinerary.days.length > 0 ? (
                    itinerary.days.map((day) => (
                      <div key={day.dayNumber} className="glass-card" style={{ padding: '1.75rem' }}>
                        
                        {/* Day Header */}
                        <div className="flex flex-col flex-md-row justify-between items-start items-md-center gap-2" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
                          <div>
                            <div className="flex items-center gap-3">
                              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.3rem', color: '#60a5fa' }}>
                                DAY {day.dayNumber}
                              </span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                • {formatDateHeader(day.date)}
                              </span>
                            </div>

                            {day.stop && (
                              <div className="flex items-center gap-1" style={{ color: '#34d399', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 600 }}>
                                <MapPin style={{ width: 14, height: 14 }} />
                                <span>{day.stop.city}, {day.stop.country}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              Daily Activities: {day.activities?.length || 0}
                            </span>
                            {day.totalCost > 0 && (
                              <span className="badge badge-success">
                                Est. ${day.totalCost}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Activities List for this Day */}
                        {day.activities && day.activities.length > 0 ? (
                          <div className="flex flex-col gap-3">
                            {day.activities.map((act) => (
                              <div
                                key={act._id}
                                className="glass-card flex flex-col flex-md-row justify-between items-start items-md-center gap-3"
                                style={{ padding: '1rem 1.25rem', background: 'rgba(255, 255, 255, 0.03)' }}
                              >
                                <div className="flex items-start gap-3">
                                  <div style={{ background: 'rgba(37, 99, 235, 0.15)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center', minWidth: '70px' }}>
                                    <Clock style={{ width: 14, height: 14, color: '#60a5fa', margin: '0 auto 0.2rem auto' }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>{act.time}</span>
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{act.name}</h4>
                                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{act.category}</span>
                                    </div>
                                    
                                    {act.description && (
                                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{act.description}</p>
                                    )}

                                    <div className="flex items-center gap-4" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                      <span>Duration: {formatDuration(act.duration)}</span>
                                      <span>Cost: ${act.cost || 0}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Activity Item Actions */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingActivity(act);
                                      setIsActivityModalOpen(true);
                                    }}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                                  >
                                    <Edit3 style={{ width: 14, height: 14 }} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(act)}
                                    className="btn"
                                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                                  >
                                    <Trash2 style={{ width: 14, height: 14 }} />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-dimmed)', fontSize: '0.9rem' }}>
                            No activities planned for Day {day.dayNumber}. Click "Add Activity" to schedule.
                          </div>
                        )}

                      </div>
                    ))
                  ) : null}
                </div>
              )}

              {/* 2. TIMELINE VIEW */}
              {activeView === 'timeline' && (
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Chronological Activity Stream</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Visual timeline of all scheduled events across your trip</p>
                  </div>

                  <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                    {/* Continuous Vertical Timeline Line */}
                    <div style={{ position: 'absolute', left: '11px', top: '8px', bottom: '8px', width: '2px', backgroundColor: 'var(--primary-500)' }} />

                    {itinerary.days?.flatMap((d) => d.activities).length > 0 ? (
                      itinerary.days.map((day) =>
                        day.activities && day.activities.length > 0 ? (
                          <div key={`tl_day_${day.dayNumber}`} style={{ marginBottom: '2rem' }}>
                            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#2563eb', border: '3px solid #0b0f19', position: 'absolute', left: '0px', transform: 'translateX(-50%)' }} />
                              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>
                                Day {day.dayNumber} — {formatDateHeader(day.date)} {day.stop && `(${day.stop.city})`}
                              </span>
                            </div>

                            <div className="flex flex-col gap-3" style={{ paddingLeft: '1rem' }}>
                              {day.activities.map((act) => (
                                <div key={`tl_act_${act._id}`} className="glass-card" style={{ padding: '1rem 1.25rem', background: 'rgba(255, 255, 255, 0.03)' }}>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{act.time}</span>
                                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{act.name}</h4>
                                      </div>
                                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{act.description}</p>
                                    </div>
                                    <span className="badge badge-success">${act.cost || 0}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null
                      )
                    ) : (
                      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                        <Clock style={{ width: 36, height: 36, color: 'var(--text-dimmed)', margin: '0 auto 0.75rem auto' }} />
                        <p>No timeline events available. Add activities to populate the chronological timeline.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
        message={`Are you sure you want to remove "${deleteTarget?.name}" from this itinerary?`}
        confirmText="Remove Activity"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
