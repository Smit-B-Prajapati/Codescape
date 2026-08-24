import React from 'react';

const CATEGORY_COLORS = {
  Transportation: '#3b82f6', // Azure Blue
  Accommodation: '#8b5cf6', // Indigo Violet
  Food: '#10b981',         // Emerald Green
  Activities: '#f59e0b',   // Amber Gold
  Other: '#64748b',        // Slate Neutral
};

export default function BudgetChart({ categories = {}, totalCost = 0 }) {
  const catEntries = Object.entries(categories).filter(([_, val]) => val > 0);

  // SVG Donut Chart Calculation
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = catEntries.map(([category, amount]) => {
    const percent = totalCost > 0 ? amount / totalCost : 0;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = [
      `M ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `L 0 0`,
    ].join(' ');

    return {
      category,
      amount,
      percent: (percent * 100).toFixed(1),
      color: CATEGORY_COLORS[category] || '#64748b',
      pathData,
    };
  });

  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Category Cost Distribution
      </h3>

      {totalCost > 0 && slices.length > 0 ? (
        <div className="grid grid-cols-1 grid-cols-2 gap-6 items-center">
          
          {/* Donut Graphic */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
            <svg viewBox="-1.1 -1.1 2.2 2.2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              {slices.map((slice, i) => (
                <path
                  key={slice.category || i}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="#111827"
                  strokeWidth="0.04"
                />
              ))}
              {/* Center Hole for Donut Effect */}
              <circle cx="0" cy="0" r="0.65" fill="#111827" />
            </svg>

            <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Spent</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${totalCost.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex flex-col gap-3">
            {Object.entries(categories).map(([cat, amount]) => {
              const percent = totalCost > 0 ? ((amount / totalCost) * 100).toFixed(1) : 0;
              const color = CATEGORY_COLORS[cat] || '#64748b';
              return (
                <div key={cat} className="flex justify-between items-center" style={{ fontSize: '0.9rem' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ width: 12, height: 12, borderRadius: '3px', backgroundColor: color, display: 'inline-block' }} />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{cat}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{percent}%</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>${amount.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          No expense records or scheduled activity costs recorded yet.
        </div>
      )}
    </div>
  );
}
