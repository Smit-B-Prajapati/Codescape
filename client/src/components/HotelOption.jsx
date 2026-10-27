import React from 'react';
import { CheckCircle2, MapPin, Star, Sparkles, Building2 } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import { getHotelFallbackImage } from '../utils/countryPhotos';

/**
 * HotelOption Component
 * Displays an individual accommodation option from simulated inventory.
 * Uses ImageWithFallback to ensure reliable, unique hotel photography without layout shifts.
 */
export default function HotelOption({
  item,
  isChosen = false,
  formatCurrency,
  onSelect,
  onBook,
}) {
  const hotel = item.hotel || item;
  const rating = Number(hotel.rating) || 4.2;
  const recommendation = item.recommendationReason || hotel.recommendationReason;
  const fallbackImg = getHotelFallbackImage(hotel.name || hotel.id);

  return (
    <div
      className={`glass-card item-card ${isChosen ? 'is-selected' : ''}`}
      onClick={onSelect ? () => onSelect(item) : undefined}
      style={{
        overflow: 'hidden',
        cursor: onSelect ? 'pointer' : 'default',
        border: isChosen ? '2px solid #0d9488' : '1px solid var(--border-glass)',
        background: isChosen ? 'rgba(13, 148, 136, 0.08)' : 'var(--bg-glass)',
        borderRadius: 'var(--radius-md)',
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        {/* Hotel Image with Overlay Tag */}
        <div style={{ position: 'relative', width: '100%', height: '150px', overflow: 'hidden' }}>
          <ImageWithFallback
            src={hotel.image}
            fallbackSrc={fallbackImg}
            alt={hotel.name || 'Hotel stay'}
          />
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              display: 'flex',
              gap: '6px',
              zIndex: 2,
            }}
          >
            <span
              className="badge"
              style={{
                background: 'rgba(16, 24, 47, 0.82)',
                color: '#FFE0B9',
                border: '1px solid rgba(255, 224, 185, 0.4)',
                backdropFilter: 'blur(8px)',
                fontWeight: 700,
                fontSize: '0.72rem',
                letterSpacing: '0.03em',
                padding: '3px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles style={{ width: 11, height: 11, color: '#FFE0B9' }} /> Curated Stay
            </span>
          </div>

          {isChosen && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 2,
              }}
            >
              <span
                className="badge"
                style={{
                  background: 'rgba(13, 148, 136, 0.92)',
                  color: '#ffffff',
                  backdropFilter: 'blur(6px)',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              >
                <CheckCircle2 style={{ width: 12, height: 12 }} /> Selected
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Header Title & Rating */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.45rem' }}>
            <h4 style={{ fontSize: '1.08rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {hotel.name}
            </h4>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                background: 'rgba(217, 119, 6, 0.12)',
                border: '1px solid rgba(217, 119, 6, 0.25)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                flexShrink: 0,
              }}
            >
              <Star style={{ width: 12, height: 12, fill: '#d97706', color: '#d97706' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706' }}>{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <MapPin style={{ width: 13, height: 13, color: 'var(--primary)', flexShrink: 0 }} />
            <span>{hotel.location || hotel.city || 'Central District'}</span>
          </div>

          {/* Recommendation Reason */}
          {recommendation && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                background: 'var(--surface-warm)',
                border: '1px solid rgba(255, 224, 185, 0.4)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '0.85rem',
              }}
            >
              <Sparkles style={{ width: 12, height: 12, color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ fontStyle: 'italic' }}>{recommendation}</span>
            </div>
          )}

          {/* Amenities Chips */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.85rem' }}>
              {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.72rem',
                    background: 'var(--btn-secondary-bg)',
                    color: 'var(--text-dimmed)',
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pricing & Footer Actions */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dimmed)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
            Estimated Rate
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatCurrency(hotel.pricePerNight || hotel.costPerNight || hotel.estimatedTotalCost, hotel.currency || 'INR')}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}> / night</span>
        </div>

        {onBook && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBook(item);
            }}
            className={`btn ${isChosen ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '0.45rem 0.95rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              backgroundColor: isChosen ? 'var(--primary)' : undefined,
              color: isChosen ? '#FEF5EE' : undefined,
            }}
          >
            {isChosen ? 'Selected Stay ✓' : 'Select Stay'}
          </button>
        )}
      </div>
    </div>
  );
}
