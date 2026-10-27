import React, { useState, useEffect } from 'react';
import { MapPin, Compass, Plus, Bookmark } from 'lucide-react';
import { toggleSavedDestinationApi, getProfileApi } from '../services/api';
import ImageWithFallback from './ImageWithFallback';
import { getCountryCoverPhoto } from '../utils/countryPhotos';

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

  const fallbackImage = getCountryCoverPhoto(destination.city, [destination.country]);

  return (
    <div
      className="glass-card flex flex-col justify-between"
      style={{
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        transition: 'var(--transition-normal)',
      }}
    >
      <div style={{ height: '190px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <ImageWithFallback
          src={destination.image}
          fallbackSrc={fallbackImage}
          alt={`${destination.city}, ${destination.country}`}
        />
        
        {/* Category Badge */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
          <span
            className="badge"
            style={{
              background: 'rgba(16, 24, 47, 0.75)',
              color: '#FFE0B9',
              border: '1px solid rgba(255, 224, 185, 0.35)',
              backdropFilter: 'blur(8px)',
              fontWeight: 700,
            }}
          >
            <Compass style={{ width: 12, height: 12, color: '#E2A9CA' }} /> {destination.category}
          </span>
        </div>

        {/* Bookmark Button */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
          <button
            onClick={handleToggleSave}
            style={{
              background: 'rgba(16, 24, 47, 0.68)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
            title={isSaved ? 'Remove from Saved Destinations' : 'Bookmark to Saved Destinations'}
            aria-label="Bookmark destination"
          >
            <Bookmark
              style={{
                width: 16,
                height: 16,
                color: isSaved ? '#FFE0B9' : '#FEF5EE',
                fill: isSaved ? '#FFE0B9' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="flex items-center gap-1" style={{ marginBottom: '0.4rem' }}>
            <MapPin style={{ width: 15, height: 15, color: 'var(--primary)', flexShrink: 0 }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
              {destination.city},{' '}
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '1rem' }}>
                {destination.country}
              </span>
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.55' }}>
            {destination.description}
          </p>
        </div>

        <div
          style={{
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)' }}>
            Est. {destination.avgCostPerDay}
          </span>
          <button
            onClick={() => onPlanTrip && onPlanTrip(destination)}
            className="btn btn-secondary"
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            <span>Plan This</span>
          </button>
        </div>
      </div>
    </div>
  );
}
