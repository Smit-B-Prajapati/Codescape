import React from 'react';
import { Clock, DollarSign, Plus, Trash2, Tag, Compass } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

const CATEGORY_FALLBACK_IMAGES = {
  Food: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  'Food & Dining': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  Dining: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  Sightseeing: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
  Nature: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  Culture: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  Cultural: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  Shopping: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
  Adventure: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
  Nightlife: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
  Relaxation: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
};

const getCategoryFallbackImage = (cat) => {
  if (!cat) return CATEGORY_FALLBACK_IMAGES.Sightseeing;
  return CATEGORY_FALLBACK_IMAGES[cat] || CATEGORY_FALLBACK_IMAGES.Sightseeing;
};

export default function ActivityCard({ activity, onAddClick, onDeleteClick, isAdded = false }) {
  const formatDuration = (mins) => {
    if (!mins) return '60 mins';
    if (mins >= 60) {
      const hours = (mins / 60).toFixed(1);
      return `${hours.endsWith('.0') ? parseInt(hours) : hours} hrs`;
    }
    return `${mins} mins`;
  };

  const fallbackImg = getCategoryFallbackImage(activity.category);
  const displayImage = activity.image && activity.image.trim() ? activity.image : fallbackImg;

  return (
    <div
      className="glass-card flex flex-col justify-between"
      style={{
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        transition: 'var(--transition-normal)',
      }}
    >
      {/* Banner Image */}
      <div style={{ height: '150px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <ImageWithFallback
          src={displayImage}
          fallbackSrc={fallbackImg}
          alt={activity.name}
        />
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
          <span
            className="badge"
            style={{
              background: 'rgba(16, 24, 47, 0.82)',
              color: '#FFE0B9',
              border: '1px solid rgba(255, 224, 185, 0.3)',
              backdropFilter: 'blur(6px)',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            <Tag style={{ width: 10, height: 10, color: '#E2A9CA' }} /> {activity.category}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div style={{ padding: '1.15rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem', lineHeight: '1.3' }}>
            {activity.name}
          </h4>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.95rem', lineHeight: '1.5' }}>
            {activity.description}
          </p>
        </div>

        {/* Metrics & Actions */}
        <div>
          <div
            className="flex items-center justify-between"
            style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}
          >
            <div className="flex items-center gap-1">
              <Clock style={{ width: 13, height: 13, color: 'var(--primary)' }} />
              <span>{formatDuration(activity.duration)}</span>
            </div>

            <div className="flex items-center gap-1" style={{ fontWeight: 700, color: 'var(--primary)' }}>
              <span>{activity.cost > 0 ? `$${activity.cost}` : 'Free'}</span>
            </div>
          </div>

          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)' }}>
            {onDeleteClick ? (
              <button
                onClick={() => onDeleteClick(activity)}
                className="btn"
                style={{
                  width: '100%',
                  background: 'rgba(225, 29, 72, 0.1)',
                  color: '#e11d48',
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                  padding: '0.4rem',
                  fontSize: '0.82rem',
                }}
              >
                <Trash2 style={{ width: 14, height: 14 }} />
                <span>Remove Activity</span>
              </button>
            ) : (
              <button
                onClick={() => onAddClick && onAddClick(activity)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem' }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                <span>Add to Stop</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
