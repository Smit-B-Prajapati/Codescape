import React from 'react';
import { DollarSign, Map, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function BudgetHighlightCard({ stats, activeFilter = 'all', onSelectFilter }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="grid grid-cols-1 grid-cols-3 gap-6" style={{ marginBottom: '2.5rem' }}>
      {/* Total Trips */}
      <div
        onClick={() => onSelectFilter && onSelectFilter('all')}
        className="glass-card"
        style={{
          padding: '1.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          border: activeFilter === 'all' ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
          background: activeFilter === 'all' ? 'rgba(69, 87, 153, 0.1)' : 'var(--bg-glass)',
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.22s ease-in-out',
        }}
        title="Click to view all travel trips"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(69, 87, 153, 0.2) 0%, rgba(16, 24, 47, 0.1) 100%)',
              width: 52,
              height: 52,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(69, 87, 153, 0.2)',
            }}
          >
            <Map style={{ width: 24, height: 24, color: 'var(--primary)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                }}
              >
                Total Trips
              </span>
              {activeFilter === 'all' && <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--primary)' }} />}
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem', margin: 0 }}>
              {stats?.totalTrips || 0}
            </h3>
          </div>
        </div>
        <div
          style={{
            color: activeFilter === 'all' ? 'var(--primary)' : 'var(--text-dimmed)',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span>View All</span>
          <ArrowRight style={{ width: 14, height: 14 }} />
        </div>
      </div>

      {/* Upcoming Journeys */}
      <div
        onClick={() => onSelectFilter && onSelectFilter('upcoming')}
        className="glass-card"
        style={{
          padding: '1.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          border: activeFilter === 'upcoming' ? '2px solid #0d9488' : '1px solid var(--border-glass)',
          background: activeFilter === 'upcoming' ? 'rgba(13, 148, 136, 0.1)' : 'var(--bg-glass)',
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.22s ease-in-out',
        }}
        title="Click to filter upcoming journeys"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.2) 0%, rgba(16, 24, 47, 0.1) 100%)',
              width: 52,
              height: 52,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(13, 148, 136, 0.25)',
            }}
          >
            <Calendar style={{ width: 24, height: 24, color: '#0d9488' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                }}
              >
                Upcoming Journeys
              </span>
              {activeFilter === 'upcoming' && <CheckCircle2 style={{ width: 14, height: 14, color: '#0d9488' }} />}
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem', margin: 0 }}>
              {stats?.upcomingTrips || 0}
            </h3>
          </div>
        </div>
        <div
          style={{
            color: activeFilter === 'upcoming' ? '#0d9488' : 'var(--text-dimmed)',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span>Filter</span>
          <ArrowRight style={{ width: 14, height: 14 }} />
        </div>
      </div>

      {/* Total Recorded Expenses */}
      <div
        onClick={() => onSelectFilter && onSelectFilter('expenses')}
        className="glass-card"
        style={{
          padding: '1.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          border: activeFilter === 'expenses' ? '2px solid #b45309' : '1px solid var(--border-glass)',
          background: activeFilter === 'expenses' ? 'rgba(217, 119, 6, 0.1)' : 'var(--bg-glass)',
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.22s ease-in-out',
        }}
        title="Click to inspect expense budgets"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 224, 185, 0.3) 0%, rgba(217, 119, 6, 0.15) 100%)',
              width: 52,
              height: 52,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(217, 119, 6, 0.25)',
            }}
          >
            <DollarSign style={{ width: 24, height: 24, color: '#b45309' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                }}
              >
                Recorded Expenses
              </span>
              {activeFilter === 'expenses' && <CheckCircle2 style={{ width: 14, height: 14, color: '#b45309' }} />}
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem', margin: 0 }}>
              {formatCurrency(stats?.totalSpent)}
            </h3>
          </div>
        </div>
        <div
          style={{
            color: activeFilter === 'expenses' ? '#b45309' : 'var(--text-dimmed)',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span>Inspect</span>
          <ArrowRight style={{ width: 14, height: 14 }} />
        </div>
      </div>
    </div>
  );
}
