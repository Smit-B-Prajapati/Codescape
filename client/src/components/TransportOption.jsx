import React from 'react';
import { Plane, Train, Bus, CheckCircle2, Clock, ArrowRight, Armchair } from 'lucide-react';

/**
 * TransportOption Component
 * Displays an individual transport route choice (rail, flight, bus) with clear hackathon transparency.
 */
export default function TransportOption({
  item,
  isChosen = false,
  formatCurrency,
  onSelect,
  onBook,
}) {
  const Icon = item.type === 'flight' ? Plane : item.type === 'bus' ? Bus : Train;

  return (
    <div
      className={`glass-card item-card ${isChosen ? 'is-selected' : ''}`}
      onClick={onSelect ? () => onSelect(item) : undefined}
      style={{
        cursor: onSelect ? 'pointer' : 'default',
        border: isChosen ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
        background: isChosen ? 'rgba(69, 87, 153, 0.08)' : 'var(--bg-glass)',
        borderRadius: 'var(--radius-md)',
        transition: 'all 0.25s ease',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span
            className="badge badge-periwinkle"
            style={{
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.02em',
              padding: '3px 8px',
            }}
          >
            Verified Route
          </span>

          {isChosen ? (
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(69, 87, 153, 0.15)',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                fontWeight: 700,
                fontSize: '0.72rem',
              }}
            >
              <CheckCircle2 style={{ width: 12, height: 12 }} /> Selected Route
            </span>
          ) : onSelect ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>Click to select</span>
          ) : null}
        </div>

        {/* Carrier & Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'rgba(69, 87, 153, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              flexShrink: 0,
            }}
          >
            <Icon style={{ width: 16, height: 16 }} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {item.carrier || item.name}
            </h4>
            {item.trainNumber && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', fontFamily: 'monospace' }}>
                #{item.trainNumber}
              </span>
            )}
          </div>
        </div>

        {/* Route Origin -> Destination */}
        <div
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>{item.origin || item.from}</strong>
          <ArrowRight style={{ width: 13, height: 13, margin: '0 0.4rem', color: 'var(--text-dimmed)' }} />
          <strong style={{ color: 'var(--text-primary)' }}>{item.destination || item.to}</strong>
        </div>

        {/* Schedule & Times */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.82rem',
            color: 'var(--text-dimmed)',
            marginBottom: '0.85rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Clock style={{ width: 12, height: 12, display: 'inline', marginRight: '4px', color: 'var(--primary)' }} />
            Dep: <strong style={{ color: 'var(--text-primary)' }}>{item.departureTime || item.departure}</strong>
          </div>
          <div>
            Arr: <strong style={{ color: 'var(--text-primary)' }}>{item.arrivalTime || item.arrival}</strong>
          </div>
          {item.duration && (
            <span
              style={{
                fontSize: '0.74rem',
                background: 'var(--btn-secondary-bg)',
                color: 'var(--text-secondary)',
                padding: '1px 7px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-glass)',
              }}
            >
              {item.duration}
            </span>
          )}
        </div>

        {/* Seat Availability & Class Tier */}
        {(item.seatStatus || item.seatsAvailable !== undefined || item.class) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
            {item.class && (
              <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '2px 7px' }}>
                Class: {item.class}
              </span>
            )}
            {item.seatStatus ? (
              <span style={{ fontSize: '0.78rem', color: '#0d9488', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <Armchair style={{ width: 12, height: 12 }} /> {item.seatStatus}
              </span>
            ) : item.seatsAvailable !== undefined ? (
              <span style={{ fontSize: '0.78rem', color: '#0d9488', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <Armchair style={{ width: 12, height: 12 }} /> {item.seatsAvailable} seats available
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Pricing & Booking CTA */}
      {(() => {
        const unitFare = item.pricePerPerson !== undefined && item.pricePerPerson !== null
          ? item.pricePerPerson
          : (item.price !== undefined && item.price !== null
            ? item.price
            : (item.cost !== undefined && item.cost !== null
              ? item.cost
              : (item.totalRoundTripCost && item.travelers ? Math.round(item.totalRoundTripCost / (item.travelers * (item.roundTripMultiplier || 2))) : undefined)));

        return (
          <div
            style={{
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dimmed)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                Fare per traveler
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatCurrency(unitFare, item.currency || 'INR')}
              </span>
              {item.totalRoundTripCost ? (
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dimmed)', marginTop: '2px' }}>
                  Round-trip: {formatCurrency(item.totalRoundTripCost, item.currency || 'INR')}
                  {item.travelers > 1 ? ` (${item.travelers} travelers)` : ''}
                </span>
              ) : null}
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
                {isChosen ? 'Selected Route ✓' : 'Select Route'}
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}
