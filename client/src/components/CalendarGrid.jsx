import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Compass } from 'lucide-react';

export default function CalendarGrid({ days = [], selectedDate, onSelectDate, tripStartDate, tripEndDate }) {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    return tripStartDate ? new Date(tripStartDate) : new Date();
  });

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleResetToTrip = () => {
    if (tripStartDate) {
      setCurrentMonthDate(new Date(tripStartDate));
    }
  };

  // Build Grid Matrix
  const gridCells = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    gridCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    gridCells.push({ day, dateStr: formattedDate });
  }

  const getDayData = (dateStr) => {
    return days.find((d) => d.date === dateStr);
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      {/* Month Header Navigation */}
      <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
        <div className="flex items-center gap-2">
          <CalendarIcon style={{ width: 22, height: 22, color: '#3b82f6' }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {tripStartDate && (
            <button 
              onClick={handleResetToTrip} 
              className="btn btn-secondary" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              title="Jump to Trip Start Date"
            >
              Trip Month
            </button>
          )}
          <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: '0.35rem 0.55rem' }} title="Previous Month">
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: '0.35rem 0.55rem' }} title="Next Month">
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* Day of Week Headers - Explicit 7-column Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '0.4rem', 
          textAlign: 'center', 
          marginBottom: '0.6rem', 
          fontWeight: 700, 
          fontSize: '0.8rem', 
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        {dayNames.map((d) => (
          <div key={d} style={{ padding: '0.4rem 0', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells - Explicit 7-column Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '0.4rem' 
        }}
      >
        {gridCells.map((cell, index) => {
          if (!cell) {
            return (
              <div 
                key={`empty_${index}`} 
                style={{ 
                  minHeight: '64px', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px solid rgba(255, 255, 255, 0.02)' 
                }} 
              />
            );
          }

          const dayData = getDayData(cell.dateStr);
          const isSelected = selectedDate === cell.dateStr;
          const isTripDay = !!dayData;
          const activityCount = dayData?.activities?.length || 0;

          return (
            <div
              key={cell.dateStr}
              onClick={() => isTripDay && onSelectDate(cell.dateStr)}
              style={{
                minHeight: '68px',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                border: isSelected 
                  ? '2px solid #3b82f6' 
                  : isTripDay 
                  ? '1px solid rgba(59, 130, 246, 0.4)' 
                  : '1px solid rgba(255, 255, 255, 0.04)',
                background: isSelected
                  ? 'rgba(37, 99, 235, 0.3)'
                  : isTripDay
                  ? 'rgba(30, 58, 138, 0.25)'
                  : 'rgba(255, 255, 255, 0.02)',
                boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.4)' : 'none',
                cursor: isTripDay ? 'pointer' : 'default',
                opacity: isTripDay ? 1 : 0.45,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="flex justify-between items-center">
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: isTripDay ? 800 : 400, 
                  color: isSelected ? '#ffffff' : isTripDay ? '#60a5fa' : 'var(--text-dimmed)' 
                }}>
                  {cell.day}
                </span>

                {isTripDay && (
                  <span className="badge badge-info" style={{ fontSize: '0.62rem', padding: '0.1rem 0.3rem', fontWeight: 700 }}>
                    Day {dayData.dayNumber}
                  </span>
                )}
              </div>

              {/* City Stop / Activity Summary */}
              {isTripDay && (
                <div style={{ marginTop: '0.25rem' }}>
                  {dayData.stop && (
                    <div style={{ fontSize: '0.68rem', color: '#34d399', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 700 }}>
                      📍 {dayData.stop.city}
                    </div>
                  )}

                  {activityCount > 0 && (
                    <div style={{ fontSize: '0.65rem', color: '#93c5fd', marginTop: '0.1rem', fontWeight: 600 }}>
                      ⚡ {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
