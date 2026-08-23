import React, { useState } from 'react';
import { MapPin, Calendar, ArrowUp, ArrowDown, Edit3, Trash2, Plus, ArrowRight } from 'lucide-react';

export default function StopList({ stops = [], onReorder, onEditStop, onDeleteStop, onAddStopClick }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const newStops = [...stops];
    const temp = newStops[index];
    newStops[index] = newStops[index - 1];
    newStops[index - 1] = temp;

    // Update order values
    const stopOrders = newStops.map((stop, i) => ({
      stopId: stop._id,
      order: i + 1,
    }));

    onReorder(stopOrders);
  };

  const handleMoveDown = (index) => {
    if (index >= stops.length - 1) return;
    const newStops = [...stops];
    const temp = newStops[index];
    newStops[index] = newStops[index + 1];
    newStops[index + 1] = temp;

    const stopOrders = newStops.map((stop, i) => ({
      stopId: stop._id,
      order: i + 1,
    }));

    onReorder(stopOrders);
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Multi-City Journey Route</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Sequential destination stops on your travel itinerary
          </p>
        </div>

        <button
          onClick={onAddStopClick}
          className="btn btn-primary"
          style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          <span>Add Stop</span>
        </button>
      </div>

      {/* Visual Route Flow Header */}
      {stops.length > 0 && (
        <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-glow)' }}>
          <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {stops.map((stop, idx) => (
              <React.Fragment key={stop._id || idx}>
                <span className="gradient-text">{stop.city}</span>
                {idx < stops.length - 1 && (
                  <ArrowRight style={{ width: 16, height: 16, color: '#60a5fa' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* List of Stops with Order & Controls */}
      {stops.length > 0 ? (
        <div className="flex flex-col gap-3">
          {stops.map((stop, index) => (
            <div
              key={stop._id}
              className="glass-card"
              style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)' }}
            >
              {/* Left: Sequential Order Badge & Stop Info */}
              <div className="flex items-center gap-3">
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#ffffff', flexShrink: 0 }}>
                  {index + 1}
                </div>

                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stop.city}, <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{stop.country}</span>
                  </h4>

                  <div className="flex items-center gap-2" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    <Calendar style={{ width: 14, height: 14, color: '#34d399' }} />
                    <span>{formatDate(stop.startDate)} – {formatDate(stop.endDate)}</span>
                  </div>
                </div>
              </div>

              {/* Right: Move Up / Move Down & Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Move Up */}
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.5rem', opacity: index === 0 ? 0.3 : 1 }}
                  title="Move Up"
                >
                  <ArrowUp style={{ width: 14, height: 14 }} />
                </button>

                {/* Move Down */}
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === stops.length - 1}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.5rem', opacity: index === stops.length - 1 ? 0.3 : 1 }}
                  title="Move Down"
                >
                  <ArrowDown style={{ width: 14, height: 14 }} />
                </button>

                {/* Edit Stop */}
                <button
                  onClick={() => onEditStop && onEditStop(stop)}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  title="Edit Stop Dates"
                >
                  <Edit3 style={{ width: 14, height: 14 }} />
                  <span>Edit</span>
                </button>

                {/* Delete Stop */}
                <button
                  onClick={() => onDeleteStop && onDeleteStop(stop)}
                  className="btn"
                  style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  title="Delete Stop"
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)' }}>
          <MapPin style={{ width: 36, height: 36, color: 'var(--text-dimmed)', margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No travel stops added yet</h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Search cities below or click "Add Stop" to start constructing your multi-city route.
          </p>
        </div>
      )}
    </div>
  );
}
