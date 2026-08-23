import React, { useState, useEffect } from 'react';
import { MapPin, Compass, Plus, Bookmark } from 'lucide-react';
import { toggleSavedDestinationApi, getProfileApi } from '../services/api';

export default function DestinationCard({ destination, onPlanTrip }) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    getProfileApi()
      .then((res) => {
        if (res.success && res.user?.savedDestinations) {
          const saved = res.user.savedDestinations.some(
            (d) => d.city.toLowerCase() === destination.city.toLowerCase()
          );
          setIsSaved(saved);
        }
      })
      .catch(() => {});
  }, [destination]);

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    try {
      const res = await toggleSavedDestinationApi({
        city: destination.city,
        country: destination.country,
        image: destination.image,
      });
      if (res.success) {
        setIsSaved(res.isSaved);
      }
    } catch (err) {
      console.error('[Save destination error]:', err);
    }
  };

  return (
    <div className="glass-card flex flex-col justify-between" style={{ overflow: 'hidden' }}>
      <div style={{ height: '180px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <img
          src={destination.image}
          alt={`${destination.city}, ${destination.country}`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80';
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
          <span className="badge badge-info">
            <Compass style={{ width: 12, height: 12 }} /> {destination.category}
          </span>
        </div>

        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <button
            onClick={handleToggleSave}
            style={{ background: 'rgba(11, 15, 25, 0.65)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title={isSaved ? "Remove from Saved Destinations" : "Bookmark to Saved Destinations"}
          >
            <Bookmark style={{ width: 16, height: 16, color: isSaved ? '#f59e0b' : '#ffffff', fill: isSaved ? '#f59e0b' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="flex items-center gap-1" style={{ marginBottom: '0.3rem' }}>
            <MapPin style={{ width: 16, height: 16, color: '#f59e0b' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              {destination.city}, <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{destination.country}</span>
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
            {destination.description}
          </p>
        </div>

        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>
            Est. {destination.avgCostPerDay}
          </span>
          <button
            onClick={() => onPlanTrip && onPlanTrip(destination)}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            <span>Plan This</span>
          </button>
        </div>
      </div>
    </div>
  );
}
