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
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          border: activeFilter === 'all' ? '2px solid #3b82f6' : '1px solid var(--border-glass)',
          background: activeFilter === 'all' ? 'rgba(59, 130, 246, 0.12)' : undefined,
          transition: 'all 0.2s ease-in-out',
        }}
        title="Click to view all travel trips"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.18)', width: 52, height: 52, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Map style={{ width: 26, height: 26, color: '#60a5fa' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Trips</span>
              {activeFilter === 'all' && <CheckCircle2 style={{ width: 14, height: 14, color: '#3b82f6' }} />}
            </div>
            <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>{stats?.totalTrips || 0}</h3>
          </div>
        </div>
        <div style={{ color: activeFilter === 'all' ? '#60a5fa' : 'var(--text-dimmed)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <span>View All</span>
          <ArrowRight style={{ width: 14, height: 14 }} />
        </div>
      </div>

      {/* Upcoming Journeys */}
      <div
        onClick={() => onSelectFilter && onSelectFilter('upcoming')}
        className="glass-card"
        style={{
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          border: activeFilter === 'upcoming' ? '2px solid #10b981' : '1px solid var(--border-glass)',
          background: activeFilter === 'upcoming' ? 'rgba(16, 185, 129, 0.12)' : undefined,
          transition: 'all 0.2s ease-in-out',
        }}
        title="Click to filter upcoming journeys"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.18)', width: 52, height: 52, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar style={{ width: 26, height: 26, color: '#34d399' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Upcoming Journeys</span>
              {activeFilter === 'upcoming' && <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981' }} />}
            </div>
            <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>{stats?.upcomingTrips || 0}</h3>
          </div>
        </div>
        <div style={{ color: activeFilter === 'upcoming' ? '#34d399' : 'var(--text-dimmed)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <span>Filter</span>
          <ArrowRight style={{ width: 14, height: 14 }} />
        </div>
      </div>

      {/* Total Recorded Expenses */}
      <div
        onClick={() => onSelectFilter && onSelectFilter('expenses')}
        className="glass-card"
        style={{
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          border: activeFilter === 'expenses' ? '2px solid #f59e0b' : '1px solid var(--border-glass)',
          background: activeFilter === 'expenses' ? 'rgba(245, 158, 11, 0.12)' : undefined,
          transition: 'all 0.2s ease-in-out',
        }}
        title="Click to inspect expense budgets"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.18)', width: 52, height: 52, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign style={{ width: 26, height: 26, color: '#fbbf24' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Recorded Expenses</span>
              {activeFilter === 'expenses' && <CheckCircle2 style={{ width: 14, height: 14, color: '#f59e0b' }} />}
            </div>
            <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>{formatCurrency(stats?.totalSpent)}</h3>
          </div>
        </div>
        <div style={{ color: activeFilter === 'expenses' ? '#fbbf24' : 'var(--text-dimmed)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <span>Inspect</span>
          <ArrowRight style={{ width: 14, height: 14 }} />
        </div>
      </div>
    </div>
  );
}
