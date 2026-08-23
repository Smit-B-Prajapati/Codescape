import React from 'react';
import { Clock, DollarSign, Plus, Trash2, Tag, Compass } from 'lucide-react';

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

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Sightseeing': return 'badge-info';
      case 'Food': return 'badge-success';
      case 'Adventure': return 'badge-info';
      case 'Nature': return 'badge-success';
      case 'Culture': return 'badge-info';
      default: return 'badge-info';
    }
  };

  const displayImage = activity.image && activity.image.trim()
    ? activity.image
    : getCategoryFallbackImage(activity.category);

  return (
    <div className="glass-card flex flex-col justify-between" style={{ overflow: 'hidden' }}>
      {/* Banner Image */}
      <div style={{ height: '140px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <img
          src={displayImage}
          alt={activity.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getCategoryFallbackImage(activity.category);
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
          <span className={`badge ${getCategoryBadgeClass(activity.category)}`} style={{ fontSize: '0.75rem' }}>
            <Tag style={{ width: 10, height: 10 }} /> {activity.category}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem', lineHeight: '1.3' }}>
            {activity.name}
          </h4>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: '1.4' }}>
            {activity.description}
          </p>
        </div>

        {/* Metrics & Actions */}
        <div>
          <div className="flex items-center justify-between" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            <div className="flex items-center gap-1">
              <Clock style={{ width: 13, height: 13, color: '#60a5fa' }} />
              <span>{formatDuration(activity.duration)}</span>
            </div>

            <div className="flex items-center gap-1" style={{ fontWeight: 600, color: '#34d399' }}>
              <DollarSign style={{ width: 13, height: 13 }} />
              <span>{activity.cost > 0 ? `$${activity.cost}` : 'Free'}</span>
            </div>
          </div>

          <div style={{ paddingTop: '0.65rem', borderTop: '1px solid var(--border-glass)' }}>
            {onDeleteClick ? (
              <button
                onClick={() => onDeleteClick(activity)}
                className="btn"
                style={{ width: '100%', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.35rem', fontSize: '0.8rem' }}
              >
                <Trash2 style={{ width: 14, height: 14 }} />
                <span>Remove Activity</span>
              </button>
            ) : (
              <button
                onClick={() => onAddClick && onAddClick(activity)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}
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
