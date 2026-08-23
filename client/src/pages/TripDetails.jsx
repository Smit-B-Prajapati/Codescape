import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getTripByIdApi,
  deleteTripApi,
  addStopApi,
  updateStopApi,
  deleteStopApi,
  reorderStopsApi,
  getActivitiesByTripApi,
  addActivityToStopApi,
  deleteActivityApi,
  toggleTripShareApi,
} from '../services/api';
import Navbar from '../components/Navbar';
import StopList from '../components/StopList';
import CitySearch from '../components/CitySearch';
import StopModal from '../components/StopModal';
import ActivitySearch from '../components/ActivitySearch';
import ActivityCard from '../components/ActivityCard';
import ActivityModal from '../components/ActivityModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  Calendar,
  Globe,
  Edit3,
  Trash2,
  ArrowLeft,
  Compass,
  AlertCircle,
  Tag,
  Plus,
  Share2,
  Copy,
  CheckCircle2,
  Lock,
} from 'lucide-react';

import { getCountryCoverPhoto } from '../utils/countryPhotos';

export default function TripDetails() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');

  // Stop Modal States
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [defaultStopDates, setDefaultStopDates] = useState({});
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Activity Modal States
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedCatalogActivity, setSelectedCatalogActivity] = useState(null);
  const [activitySubmitting, setActivitySubmitting] = useState(false);

  // Delete Trip & Stop & Activity Modals
  const [showDeleteTripModal, setShowDeleteTripModal] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState(false);
  const [deleteStopTarget, setDeleteStopTarget] = useState(null);
  const [deletingStop, setDeletingStop] = useState(false);
  const [deleteActivityTarget, setDeleteActivityTarget] = useState(null);
  const [deletingActivity, setDeletingActivity] = useState(false);

  const navigate = useNavigate();

  const fetchTripDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getTripByIdApi(id);
      if (response.success && response.trip) {
        setTrip(response.trip);
        setStops(response.trip.stops || []);
      }

      const actRes = await getActivitiesByTripApi(id);
      if (actRes.success) {
        setActivities(actRes.activities || []);
      }
    } catch (err) {
      console.error('[TripDetails fetch error]:', err);
      setError(err.message || 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTripDetails();
  }, [id]);

  // Toggle Public / Private Sharing
  const handleToggleShare = async () => {
    if (!trip) return;
    const newStatus = !trip.isPublic;
    try {
      const res = await toggleTripShareApi(id, newStatus);
      if (res.success) {
        setTrip({ ...trip, isPublic: res.isPublic, publicSlug: res.publicSlug });
        setShareFeedback(`Trip is now ${res.isPublic ? 'Publicly Shared' : 'Private'}`);
        setTimeout(() => setShareFeedback(''), 3500);
      }
    } catch (err) {
      console.error('[Toggle share error]:', err);
      alert(err.message || 'Failed to update sharing settings');
    }
  };

  // Copy Share Link
  const handleCopyShareLink = () => {
    if (!trip?.publicSlug) return;
    const shareUrl = `${window.location.origin}/trip/public/${trip.publicSlug}`;
    navigator.clipboard.writeText(shareUrl);
    setShareFeedback('Public link copied to clipboard!');
    setTimeout(() => setShareFeedback(''), 3500);
  };

  // Handle City Selection from CitySearch
  const handleSelectCity = (cityItem) => {
    setEditingStop(null);
    setDefaultStopDates({
      city: cityItem.city,
      country: cityItem.country || 'India',
      startDate: trip?.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
      endDate: trip?.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '',
    });
    setIsStopModalOpen(true);
  };

  // Submit Add / Edit Stop
  const handleStopSubmit = async (formData) => {
    setModalSubmitting(true);
    try {
      if (editingStop) {
        const res = await updateStopApi(id, editingStop._id, formData);
        if (res.success) {
          setStops(stops.map((s) => (s._id === editingStop._id ? res.stop : s)));
        }
      } else {
        const res = await addStopApi(id, formData);
        if (res.success) {
          setStops([...stops, res.stop]);
        }
      }
      setIsStopModalOpen(false);
      setEditingStop(null);
    } catch (err) {
      console.error('[Stop submit error]:', err);
      alert(err.message || 'Failed to save destination stop');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Reorder Stops
  const handleReorderStops = async (stopOrders) => {
    const sorted = [...stops].sort((a, b) => {
      const orderA = stopOrders.find((o) => o.stopId === a._id)?.order || a.order;
      const orderB = stopOrders.find((o) => o.stopId === b._id)?.order || b.order;
      return orderA - orderB;
    });
    setStops(sorted);

    try {
      await reorderStopsApi(id, stopOrders);
    } catch (err) {
      console.error('[Reorder stops error]:', err);
      fetchTripDetails();
    }
  };

  // Add Activity Trigger from ActivitySearch
  const handleAddActivityFromCatalog = (catalogAct) => {
    if (stops.length === 0) {
      alert('Please add at least one destination stop before scheduling activities.');
      return;
    }
    setSelectedCatalogActivity({
      name: catalogAct.name,
      description: catalogAct.description,
      category: catalogAct.category,
      duration: catalogAct.duration,
      cost: catalogAct.cost,
    });
    setIsActivityModalOpen(true);
  };

  // Submit Activity Form
  const handleActivitySubmit = async (activityData) => {
    setActivitySubmitting(true);
    try {
      const res = await addActivityToStopApi(id, activityData.stopId, activityData);
      if (res.success && res.activity) {
        setActivities([...activities, res.activity]);
        setIsActivityModalOpen(false);
        setSelectedCatalogActivity(null);
      }
    } catch (err) {
      console.error('[Add activity error]:', err);
      alert(err.message || 'Failed to add activity');
    } finally {
      setActivitySubmitting(false);
    }
  };

  // Remove Activity
  const handleDeleteActivityConfirm = async () => {
    if (!deleteActivityTarget) return;

    setDeletingActivity(true);
    try {
      const res = await deleteActivityApi(id, deleteActivityTarget._id);
      if (res.success) {
        setActivities(activities.filter((a) => a._id !== deleteActivityTarget._id));
        setDeleteActivityTarget(null);
      }
    } catch (err) {
      console.error('[Delete activity error]:', err);
      alert(err.message || 'Failed to remove activity');
    } finally {
      setDeletingActivity(false);
    }
  };

  // Delete Stop Confirmation
  const handleDeleteStopConfirm = async () => {
    if (!deleteStopTarget) return;

    setDeletingStop(true);
    try {
      const res = await deleteStopApi(id, deleteStopTarget._id);
      if (res.success) {
        setStops(stops.filter((s) => s._id !== deleteStopTarget._id));
        setActivities(activities.filter((a) => a.stop !== deleteStopTarget._id));
        setDeleteStopTarget(null);
      }
    } catch (err) {
      console.error('[Delete stop error]:', err);
      alert(err.message || 'Failed to delete stop');
    } finally {
      setDeletingStop(false);
    }
  };

  // Delete Trip
  const handleDeleteTrip = async () => {
    setDeletingTrip(true);
    try {
      const response = await deleteTripApi(id);
      if (response.success) {
        navigate('/trips');
      }
    } catch (err) {
      console.error('[Delete trip error]:', err);
      alert(err.message || 'Failed to delete trip');
    } finally {
      setDeletingTrip(false);
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const diffTime = Math.abs(new Date(end) - new Date(start));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;
  };

  const defaultCover = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container">

          {/* Navigation Back Link */}
          <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
            <Link to="/trips" className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
              <ArrowLeft style={{ width: 16, height: 16 }} />
              <span>Back to My Trips</span>
            </Link>

            {/* Quick Link Actions */}
            {trip && (
              <div className="flex items-center gap-2">
                <Link to={`/trips/${trip._id}/itinerary`} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
                  <Calendar style={{ width: 14, height: 14 }} />
                  <span>Itinerary Builder</span>
                </Link>
                <Link to={`/trips/${trip._id}/calendar`} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
                  <Globe style={{ width: 14, height: 14 }} />
                  <span>Calendar View</span>
                </Link>
              </div>
            )}
          </div>

          {/* Feedback Banner */}
          {shareFeedback && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <CheckCircle2 style={{ width: 18, height: 18 }} />
              <span>{shareFeedback}</span>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle style={{ width: 20, height: 20 }} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Compass className="pulse-glow" style={{ width: 44, height: 44, color: '#3b82f6', margin: '0 auto 1rem auto' }} />
              <p style={{ fontFamily: 'var(--font-heading)' }}>Loading trip workspace...</p>
            </div>
          ) : trip ? (
            <div>
              {/* Cover Banner */}
              <div className="glass-card" style={{ height: '320px', width: '100%', position: 'relative', overflow: 'hidden', marginBottom: '2rem' }}>
                <img
                  src={(trip.coverPhoto && !trip.coverPhoto.includes('photo-1488646953014-85cb44e25828'))
                    ? trip.coverPhoto
                    : getCountryCoverPhoto(trip.name, stops.map(s => s.city + ' ' + s.country))}
                  alt={trip.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getCountryCoverPhoto(trip.name, stops.map(s => s.city + ' ' + s.country));
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11, 15, 25, 0.95) 0%, rgba(11, 15, 25, 0.3) 60%, transparent 100%)' }} />

                <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem' }} className="flex flex-col flex-md-row justify-between items-start items-md-end gap-4">
                  <div>
                    <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
                      <span className={`badge ${trip.isPublic ? 'badge-success' : 'badge-info'}`}>
                        {trip.isPublic ? <Globe style={{ width: 12, height: 12 }} /> : <Lock style={{ width: 12, height: 12 }} />}
                        {trip.isPublic ? 'Publicly Shared' : 'Private Trip'}
                      </span>
                      <span className="badge badge-info" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}>
                        {calculateDuration(trip.startDate, trip.endDate)}
                      </span>
                    </div>
                    <h1 style={{ fontSize: '2.6rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>{trip.name}</h1>
                  </div>

                  {/* Sharing Controls & Actions */}
                  <div className="flex items-center gap-3">
                    {/* Toggle Public/Private */}
                    <button
                      onClick={handleToggleShare}
                      className="btn"
                      style={{
                        background: trip.isPublic ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: trip.isPublic ? '#34d399' : '#ffffff',
                        border: '1px solid var(--border-glass)',
                        padding: '0.65rem 1rem',
                      }}
                    >
                      {trip.isPublic ? <Globe style={{ width: 16, height: 16 }} /> : <Lock style={{ width: 16, height: 16 }} />}
                      <span>{trip.isPublic ? 'Make Private' : 'Make Public'}</span>
                    </button>

                    {/* Copy Share Link */}
                    {trip.isPublic && (
                      <button onClick={handleCopyShareLink} className="btn btn-secondary" style={{ padding: '0.65rem 1rem' }} title="Copy Public Share URL">
                        <Share2 style={{ width: 16, height: 16 }} />
                        <span>Copy Link</span>
                      </button>
                    )}

                    <Link to={`/trips/${trip._id}/edit`} className="btn btn-secondary" style={{ padding: '0.65rem 1rem' }}>
                      <Edit3 style={{ width: 16, height: 16 }} />
                      <span>Edit</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div className="flex flex-col gap-6">

                {/* 1. Sequential Route Timeline */}
                <StopList
                  stops={stops}
                  onReorder={handleReorderStops}
                  onEditStop={(stop) => {
                    setEditingStop(stop);
                    setIsStopModalOpen(true);
                  }}
                  onDeleteStop={(stop) => setDeleteStopTarget(stop)}
                  onAddStopClick={() => {
                    setEditingStop(null);
                    setDefaultStopDates({
                      startDate: trip?.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
                      endDate: trip?.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '',
                    });
                    setIsStopModalOpen(true);
                  }}
                />

                {/* 2. Scheduled Activities Section */}
                <section className="glass-card" style={{ padding: '1.75rem' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
                    <div>
                      <div className="badge badge-success" style={{ marginBottom: '0.35rem' }}>
                        <Tag style={{ width: 12, height: 12 }} /> Scheduled Activities ({activities.length})
                      </div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Activities on this Trip</h3>
                    </div>

                    <button
                      onClick={() => setIsActivityModalOpen(true)}
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
                    >
                      <Plus style={{ width: 14, height: 14 }} />
                      <span>Custom Activity</span>
                    </button>
                  </div>

                  {activities.length > 0 ? (
                    <div className="grid grid-cols-1 grid-cols-2 grid-cols-3 gap-4">
                      {activities.map((act) => (
                        <ActivityCard
                          key={act._id}
                          activity={act}
                          onDeleteClick={(target) => setDeleteActivityTarget(target)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)' }}>
                      <Tag style={{ width: 36, height: 36, color: 'var(--text-dimmed)', margin: '0 auto 0.75rem auto' }} />
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No activities scheduled yet</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Discover activities below or click "Custom Activity" to add sightseeing tours, food walks, and adventures.
                      </p>
                    </div>
                  )}
                </section>

                {/* 3. Activity Discovery Catalog */}
                <ActivitySearch
                  selectedStopCity={stops[0]?.city || ''}
                  onAddActivityClick={handleAddActivityFromCatalog}
                />

                {/* 4. City Discovery Search */}
                <CitySearch
                  onSelectCity={handleSelectCity}
                  tripDates={{ startDate: trip.startDate, endDate: trip.endDate }}
                />

              </div>
            </div>
          ) : null}

        </div>
      </main>

      {/* Stop Modal */}
      <StopModal
        isOpen={isStopModalOpen}
        onClose={() => {
          setIsStopModalOpen(false);
          setEditingStop(null);
        }}
        onSubmit={handleStopSubmit}
        initialData={editingStop}
        defaultDates={defaultStopDates}
        loading={modalSubmitting}
      />

      {/* Activity Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setSelectedCatalogActivity(null);
        }}
        onSubmit={handleActivitySubmit}
        stops={stops}
        initialData={selectedCatalogActivity}
        loading={activitySubmitting}
      />

      {/* Delete Activity Modal */}
      <ConfirmModal
        isOpen={!!deleteActivityTarget}
        title="Remove Activity"
        message={`Are you sure you want to remove "${deleteActivityTarget?.name}" from this trip?`}
        confirmText="Remove Activity"
        loading={deletingActivity}
        onConfirm={handleDeleteActivityConfirm}
        onCancel={() => setDeleteActivityTarget(null)}
      />

      {/* Delete Stop Modal */}
      <ConfirmModal
        isOpen={!!deleteStopTarget}
        title="Delete Travel Stop"
        message={`Are you sure you want to remove ${deleteStopTarget?.city}, ${deleteStopTarget?.country} from this trip? All associated activities for this stop will also be removed.`}
        confirmText="Remove Stop"
        loading={deletingStop}
        onConfirm={handleDeleteStopConfirm}
        onCancel={() => setDeleteStopTarget(null)}
      />

      {/* Delete Trip Modal */}
      <ConfirmModal
        isOpen={showDeleteTripModal}
        title="Delete Complete Trip"
        message={`Are you sure you want to delete "${trip?.name}"? All itinerary stops, activities, and budget records will be permanently removed.`}
        confirmText="Delete Trip"
        loading={deletingTrip}
        onConfirm={handleDeleteTrip}
        onCancel={() => setShowDeleteTripModal(false)}
      />
    </div>
  );
}
