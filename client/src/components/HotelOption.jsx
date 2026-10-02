import React from 'react';
import { CheckCircle2, MapPin, Star, Sparkles, Building2 } from 'lucide-react';

/**
 * HotelOption Component
 * 
 * Displays an individual accommodation option from simulated inventory.
 * Prominently displays "DEMO DATA" and neutral recommendation labels (no "best").
 */
export default function HotelOption({
  item,
  isChosen = false,
  formatCurrency,
  onBook,
}) {
  const hotel = item.hotel || item;
  const rating = Number(hotel.rating) || 4.2;
  const recommendation = item.recommendationReason || hotel.recommendationReason;

  return (
    <div className={`glass-card item-card ${isChosen ? 'is-selected' : ''}`} style={{ overflow: 'hidden' }}>
      {/* Hotel Image with Overlay Tag */}
      {hotel.image && (
        <div style={{ position: 'relative', width: '100%', height: '140px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', marginBottom: '0.85rem' }}>
          <img
            src={hotel.image}
            alt={hotel.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              display: 'flex',
              gap: '6px',
            }}
          >
            <span
              className="demo-tag"
              style={{
                background: 'rgba(0, 0, 0, 0.75)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                backdropFilter: 'blur(4px)',
                fontWeight: 800,
                letterSpacing: '0.06em',
                padding: '3px 8px',
              }}
            >
              DEMO DATA
            </span>
          </div>

          {isChosen && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
              }}
            >
              <span className="selected-agent-badge" style={{ background: 'rgba(16, 185, 129, 0.9)', color: '#ffffff', backdropFilter: 'blur(4px)' }}>
                <CheckCircle2 style={{ width: 12, height: 12 }} /> Selected
              </span>
            </div>
          )}
        </div>
      )}

      <div>
        {/* Top Badges if no image */}
        {!hotel.image && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span
              className="demo-tag"
              style={{
                background: 'rgba(245, 158, 11, 0.18)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                fontWeight: 800,
                letterSpacing: '0.06em',
              }}
            >
              DEMO DATA
            </span>

            {isChosen && (
              <span className="selected-agent-badge">
                <CheckCircle2 style={{ width: 12, height: 12 }} /> Selected by Agent
              </span>
            )}
          </div>
        )}

        {/* Hotel Name */}
        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem', lineHeight: 1.4 }}>
          {hotel.name}
        </h4>

        {/* Location & Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <MapPin style={{ width: 13, height: 13, color: 'var(--text-dimmed)' }} />
            <span>{hotel.area ? `${hotel.area}, ` : ''}{hotel.city}</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '3px', color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
            <Star style={{ width: 13, height: 13, fill: '#f59e0b' }} />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Neutral Recommendation Tag (No 'best') */}
        {recommendation && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              background: 'rgba(37, 99, 235, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: '#60a5fa',
              fontWeight: 600,
              textTransform: 'capitalize',
              marginBottom: '0.75rem',
            }}
          >
            <Sparkles style={{ width: 11, height: 11 }} />
            <span>{recommendation}</span>
          </div>
        )}

        {/* Amenities Highlights */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
            {hotel.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.72rem',
                  background: 'var(--btn-secondary-bg)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)',
                }}
              >
                {amenity}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pricing Footer */}
      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.85rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', display: 'block' }}>Per Night</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            {formatCurrency ? formatCurrency(hotel.pricePerNight, item.currency) : `₹${hotel.pricePerNight}`}
          </span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', display: 'block' }}>
            Total ({item.nights || 3} Nights)
          </span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatCurrency
              ? formatCurrency(item.totalCost || item.totalStayCost || (hotel.pricePerNight * (item.nights || 3) * (item.rooms || 1)), item.currency)
              : `₹${item.totalCost || item.totalStayCost}`}
          </span>
        </div>
      </div>

      {onBook && (
        <button
          type="button"
          onClick={() => onBook(hotel)}
          className="btn btn-secondary"
          style={{
            marginTop: '0.75rem',
            width: '100%',
            padding: '0.45rem',
            fontSize: '0.82rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          <Building2 style={{ width: 13, height: 13 }} />
          <span>Book Demo Hotel</span>
        </button>
      )}
    </div>
  );
}
