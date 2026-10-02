import React from 'react';
import { Plane, Train, Bus, CheckCircle2, Clock, ArrowRight, Armchair } from 'lucide-react';

/**
 * TransportOption Component
 * 
 * Displays an individual transport route choice (rail, flight, bus).
 * Clearly marked with "DEMO DATA" badge for hackathon transparency.
 */
export default function TransportOption({
  item,
  isChosen = false,
  formatCurrency,
  onBook,
}) {
  const Icon = item.type === 'flight' ? Plane : item.type === 'bus' ? Bus : Train;

  return (
    <div className={`glass-card item-card ${isChosen ? 'is-selected' : ''}`}>
      <div>
        {/* Top Badges: DEMO DATA and Selected Status */}
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

        {/* Carrier & Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Icon style={{ width: 18, height: 18, color: '#3b82f6', flexShrink: 0 }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
            {item.carrier || item.name}
          </h4>
        </div>

        {/* Route Origin -> Destination */}
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>{item.origin || item.from}</span>
          <ArrowRight style={{ width: 12, height: 12, display: 'inline', margin: '0 0.35rem', color: 'var(--text-dimmed)' }} />
          <span>{item.destination || item.to}</span>
        </div>

        {/* Schedule & Times */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-dimmed)', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <Clock style={{ width: 12, height: 12, display: 'inline', marginRight: '4px' }} />
            Dep: <strong style={{ color: 'var(--text-primary)' }}>{item.departureTime || item.departure}</strong>
          </div>
          <div>
            Arr: <strong style={{ color: 'var(--text-primary)' }}>{item.arrivalTime || item.arrival}</strong>
          </div>
          {item.duration && (
            <span style={{ fontSize: '0.75rem', background: 'var(--btn-secondary-bg)', padding: '1px 6px', borderRadius: '4px' }}>
              {item.duration}
            </span>
          )}
        </div>

        {/* Seat Availability & Class Tier */}
        {(item.seatStatus || item.seatsAvailable !== undefined || item.class) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
            {item.class && (
              <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                Class: {item.class}
              </span>
            )}
            {item.seatStatus ? (
              <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Armchair style={{ width: 12, height: 12 }} /> {item.seatStatus}
              </span>
            ) : item.seatsAvailable !== undefined ? (
              <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Armchair style={{ width: 12, height: 12 }} /> {item.seatsAvailable} seats available
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Pricing Footer */}
      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.85rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', display: 'block' }}>Per Person</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            {formatCurrency ? formatCurrency(item.pricePerPerson || item.price, item.currency) : `₹${item.pricePerPerson || item.price}`}
          </span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', display: 'block' }}>Round-Trip Total</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatCurrency
              ? formatCurrency(item.totalRoundTripCost || item.totalRoundTripPrice || (item.pricePerPerson || item.price) * 2 * (item.travelers || 1), item.currency)
              : `₹${item.totalRoundTripCost || item.totalRoundTripPrice}`}
          </span>
        </div>
      </div>

      {onBook && (
        <button
          type="button"
          onClick={() => onBook(item)}
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
          <Train style={{ width: 13, height: 13 }} />
          <span>Book Demo Transport</span>
        </button>
      )}
    </div>
  );
}
