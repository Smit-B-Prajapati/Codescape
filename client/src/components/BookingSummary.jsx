import React from 'react';
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Hotel,
  Ticket,
  Utensils,
  Wallet,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';

/**
 * BookingSummary Component
 * 
 * Visually prominent financial breakdown.
 * Distinguishes estimates from verified prices, shows contingency reserve,
 * offers actionable cost reduction suggestions and a "Regenerate Within Budget" CTA when over budget.
 */
export default function BookingSummary({
  budget = {},
  formatCurrency,
  onBookPackage,
  onRegenerateWithinBudget,
  packageCost,
  hasSelectedPackage = false,
  selectedTransportName,
  selectedHotelName,
}) {
  const breakdown = budget.breakdown || {};
  const withinBudget = budget.withinBudget !== false;
  const budgetLimit = budget.budget;
  const totalCost = budget.totalEstimatedCost || 0;
  const remaining = budget.remainingBudget;
  const utilization = budget.budgetUtilizationPercentage;

  const transportCost = breakdown.transportTotal ?? breakdown.transportation ?? 0;
  const accommodationCost = breakdown.accommodationTotal ?? breakdown.accommodation ?? 0;
  const activityCost = breakdown.activityTotal ?? breakdown.activities ?? 0;
  const foodCost = breakdown.foodEstimate ?? breakdown.food ?? 0;
  const miscCost = breakdown.miscellaneousEstimate ?? breakdown.miscellaneous ?? 0;
  const contingencyCost = breakdown.contingencyReserve ?? 0;

  const overBudgetAmount = Math.max(0, totalCost - (budgetLimit || 0));
  const overBudgetPercent = budgetLimit > 0 ? Math.round((overBudgetAmount / budgetLimit) * 100) : 0;

  return (
    <div className="ai-section">
      <div className="ai-section-title">
        <DollarSign style={{ width: 22, height: 22, color: 'var(--primary-500)' }} />
        <span>BUDGET & COST ANALYSIS</span>
      </div>

      <div
        className="glass-card budget-summary-box"
        style={{
          border: withinBudget
            ? '1px solid rgba(16, 185, 129, 0.4)'
            : '2px solid rgba(239, 68, 68, 0.6)',
          boxShadow: withinBudget
            ? '0 10px 30px -10px rgba(16, 185, 129, 0.15)'
            : '0 10px 35px -10px rgba(239, 68, 68, 0.25)',
          padding: '2rem',
        }}
      >
        {/* Prominent Health Status Header Banner */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            background: withinBudget
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.08) 100%)',
            border: withinBudget
              ? '1px solid rgba(16, 185, 129, 0.35)'
              : '1px solid rgba(239, 68, 68, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {withinBudget ? (
              <CheckCircle2 style={{ width: 32, height: 32, color: '#10b981', flexShrink: 0 }} />
            ) : (
              <AlertTriangle style={{ width: 32, height: 32, color: '#ef4444', flexShrink: 0 }} />
            )}

            <div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  margin: 0,
                  color: withinBudget ? '#10b981' : '#f87171',
                }}
              >
                {withinBudget ? '✓ Plan is Within Budget' : '⚠ Warning: Plan Exceeds Budget'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {withinBudget
                  ? budgetLimit
                    ? `Estimated costs fit comfortably within your ${formatCurrency(budgetLimit, budget.currency)} budget ceiling.`
                    : 'All costs calculated deterministically by application backend logic.'
                  : `Estimated costs exceed target budget by ${formatCurrency(overBudgetAmount, budget.currency)} (${overBudgetPercent}% over limit).`}
              </p>
            </div>
          </div>

          {budgetLimit && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                Budget Utilization
              </span>
              <span
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: withinBudget ? '#10b981' : '#ef4444',
                }}
              >
                {utilization !== null ? `${utilization}%` : 'N/A'}
              </span>
            </div>
          )}
        </div>

        {/* When over budget: show actionable cost reduction suggestions */}
        {!withinBudget && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#f87171', fontWeight: 700, fontSize: '0.92rem' }}>
              <TrendingDown style={{ width: 18, height: 18 }} />
              <span>Suggested Cost Reductions to Meet Your ₹{formatCurrency(budgetLimit, budget.currency)} Target:</span>
            </div>
            <ul style={{ margin: '0 0 0.85rem 1.25rem', padding: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <li>Replace paid attractions with top-rated free sightseeing, lakes, ghats, or public gardens.</li>
              <li>Choose budget/hostel accommodation tier or adjust room category.</li>
              <li>Consolidate daily excursions or adjust food/transit allowance.</li>
            </ul>

            {onRegenerateWithinBudget && (
              <button
                type="button"
                onClick={onRegenerateWithinBudget}
                className="btn btn-primary"
                style={{
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
                }}
              >
                <RefreshCw style={{ width: 16, height: 16 }} />
                <span>Regenerate Within Budget</span>
              </button>
            )}
          </div>
        )}

        {/* Breakdown Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="budget-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plane style={{ width: 16, height: 16, color: 'var(--primary)' }} /> Transport (Round-Trip)
            </span>
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>
              {transportCost > 0 ? formatCurrency(transportCost, budget.currency) : '₹0 (Not Included)'}
            </span>
          </div>

          <div className="budget-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hotel style={{ width: 16, height: 16, color: '#8b5cf6' }} /> Hotel (Stay Total)
            </span>
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>
              {formatCurrency(accommodationCost, budget.currency)}
            </span>
          </div>

          <div className="budget-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ticket style={{ width: 16, height: 16, color: '#ec4899' }} /> Activities & Sightseeing
            </span>
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>
              {formatCurrency(activityCost, budget.currency)}
            </span>
          </div>

          <div className="budget-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Utensils style={{ width: 16, height: 16, color: '#f59e0b' }} /> Food & Dining Allowance (Est.)
            </span>
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>
              {formatCurrency(foodCost, budget.currency)}
            </span>
          </div>

          <div className="budget-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet style={{ width: 16, height: 16, color: '#10b981' }} /> Miscellaneous & Local Transit (Est.)
            </span>
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>
              {formatCurrency(miscCost, budget.currency)}
            </span>
          </div>

          {contingencyCost > 0 && (
            <div className="budget-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck style={{ width: 16, height: 16, color: '#3b82f6' }} /> Contingency Reserve (Unspent Cushion)
              </span>
              <span style={{ fontWeight: 600, fontSize: '1rem', color: '#60a5fa' }}>
                {formatCurrency(contingencyCost, budget.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '2px dashed var(--border-glass)', margin: '1.25rem 0' }} />

        {/* TOTAL & FINANCIAL TOTALS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="budget-row total-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>TOTAL ESTIMATED SPENDING</span>
            <span style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary)' }}>
              {formatCurrency(totalCost, budget.currency)}
            </span>
          </div>

          {budgetLimit && (
            <>
              <div className="budget-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>BUDGET LIMIT</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {formatCurrency(budgetLimit, budget.currency)}
                </span>
              </div>

              <div className="budget-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>REMAINING BUDGET</span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '1.3rem',
                    color: remaining >= 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {formatCurrency(remaining, budget.currency)}
                </span>
              </div>

              {/* Progress Bar */}
              {utilization !== null && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="progress-bar-container" style={{ height: '10px', borderRadius: '5px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, utilization)}%`,
                        height: '100%',
                        backgroundColor: withinBudget ? '#10b981' : '#ef4444',
                        transition: 'width 0.6s ease-in-out',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-dimmed)', marginTop: '0.35rem' }}>
                    <span>0%</span>
                    <span>{withinBudget ? 'Comfortably Funded' : `Exceeded by ${formatCurrency(overBudgetAmount, budget.currency)}`}</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Pricing Disclaimer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', fontSize: '0.78rem', color: 'var(--text-dimmed)' }}>
            <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>Estimated prices are calculated planning baselines and not live quotes. Actual booking rates may vary.</span>
          </div>

          {/* Unified Package Booking Shortcut Card (ONLY shown when plan fits budget and booking options exist) */}
          {withinBudget && onBookPackage && hasSelectedPackage && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(69, 87, 153, 0.08) 0%, rgba(226, 169, 202, 0.12) 100%)',
                border: '1.5px solid rgba(69, 87, 153, 0.35)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', display: 'block', letterSpacing: '0.05em' }}>
                  💳 Unified Package Checkout
                </span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.15rem' }}>
                  {transportCost > 0 ? 'Pay Both Hotel & Transport Together' : 'Book Selected Accommodation'}
                </strong>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {selectedTransportName && transportCost > 0 ? `${selectedTransportName} + ` : ''}{selectedHotelName ? `${selectedHotelName}` : 'Hotel'}
                </span>
              </div>

              <button
                type="button"
                onClick={onBookPackage}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  background: 'var(--gradient-primary)',
                  color: '#FEF5EE',
                  boxShadow: '0 4px 14px rgba(69, 87, 153, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  cursor: 'pointer',
                }}
              >
                <span>Pay Total {formatCurrency ? formatCurrency(packageCost || (transportCost + accommodationCost), budget.currency) : `₹${packageCost}`}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
