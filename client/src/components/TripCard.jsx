import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Globe, Eye, Edit3, Trash2, Lock } from 'lucide-react';
import { getCountryCoverPhoto } from '../utils/countryPhotos';
import ImageWithFallback from './ImageWithFallback';

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

  const coverImage =
    trip.coverPhoto && !trip.coverPhoto.includes(defaultCameraCover)
      ? trip.coverPhoto
      : getCountryCoverPhoto(trip.name, trip.destinations);

  const fallbackImage = getCountryCoverPhoto(trip.name, trip.destinations);

  return (
    <div
      className="glass-card flex flex-col justify-between"
      style={{
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        transition: 'var(--transition-normal)',
      }}
    >
      {/* Cover Image Banner */}
      <div style={{ height: '175px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <ImageWithFallback
          src={coverImage}
          fallbackSrc={fallbackImage}
          alt={trip.name}
        />

        {/* Public / Private Badge */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
          <span
            className="badge"
            style={{
              background: trip.isPublic ? 'rgba(13, 148, 136, 0.85)' : 'rgba(16, 24, 47, 0.75)',
              color: '#FEF5EE',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: 600,
            }}
          >
            {trip.isPublic ? <Globe style={{ width: 12, height: 12 }} /> : <Lock style={{ width: 12, height: 12 }} />}
            <span>{trip.isPublic ? 'Public' : 'Private'}</span>
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.45rem', color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3 }}>
            {trip.name}
          </h3>

          <div
            className="flex items-center gap-2"
            style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}
          >
            <Calendar style={{ width: 14, height: 14, color: 'var(--primary)' }} />
            <span>
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            </span>
          </div>

          {trip.destinations && trip.destinations.length > 0 ? (
            <div
              className="flex items-center gap-2"
              style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
            >
              <MapPin style={{ width: 14, height: 14, color: '#0d9488' }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {trip.destinations.join(' • ')}
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-2"
              style={{ color: 'var(--text-dimmed)', fontSize: '0.85rem' }}
            >
              <MapPin style={{ width: 14, height: 14 }} />
              <span>{trip.stopsCount || 0} stops planned</span>
            </div>
          )}
        </div>

        {/* Action Controls: View, Edit, Delete */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            to={`/trips/${trip._id}`}
            className="btn btn-primary"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
          >
            <Eye style={{ width: 14, height: 14 }} />
            <span>View Trip</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to={`/trips/${trip._id}/edit`}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
              title="Edit Trip"
            >
              <Edit3 style={{ width: 14, height: 14 }} />
              <span>Edit</span>
            </Link>

            {onDeleteRequest && (
              <button
                onClick={() => onDeleteRequest(trip)}
                className="btn"
                style={{
                  background: 'rgba(225, 29, 72, 0.1)',
                  color: '#e11d48',
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.82rem',
                }}
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
