import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Globe, Eye, Edit3, Trash2 } from 'lucide-react';
import { getCountryCoverPhoto } from '../utils/countryPhotos';

export default function TripCard({ trip, onDeleteRequest }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const defaultCameraCover = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828';
  
  const coverImage = (trip.coverPhoto && !trip.coverPhoto.includes(defaultCameraCover))
    ? trip.coverPhoto
    : getCountryCoverPhoto(trip.name, trip.destinations);

  return (
    <div className="glass-card flex flex-col justify-between" style={{ overflow: 'hidden' }}>
      {/* Cover Image Banner */}
      <div style={{ height: '160px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <img
          src={coverImage}
          alt={trip.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getCountryCoverPhoto(trip.name, trip.destinations);
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition-normal)' }}
        />
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <span className={`badge ${trip.isPublic ? 'badge-success' : 'badge-info'}`}>
            <Globe style={{ width: 12, height: 12 }} />
            {trip.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            {trip.name}
          </h3>

          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            <Calendar style={{ width: 14, height: 14, color: '#60a5fa' }} />
            <span>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span>
          </div>

          {trip.destinations && trip.destinations.length > 0 ? (
            <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <MapPin style={{ width: 14, height: 14, color: '#34d399' }} />
              <span>{trip.destinations.join(' • ')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2" style={{ color: 'var(--text-dimmed)', fontSize: '0.85rem' }}>
              <MapPin style={{ width: 14, height: 14 }} />
              <span>{trip.stopsCount || 0} stops planned</span>
            </div>
          )}
        </div>

        {/* Action Controls: View, Edit, Delete */}
        <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', itemsCenter: 'center' }}>
          <Link
            to={`/trips/${trip._id}`}
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          >
            <Eye style={{ width: 14, height: 14 }} />
            <span>View</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to={`/trips/${trip._id}/edit`}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              title="Edit Trip"
            >
              <Edit3 style={{ width: 14, height: 14 }} />
              <span>Edit</span>
            </Link>

            {onDeleteRequest && (
              <button
                onClick={() => onDeleteRequest(trip)}
                className="btn"
                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                title="Delete Trip"
              >
                <Trash2 style={{ width: 14, height: 14 }} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
