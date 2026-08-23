import React, { useState, useEffect } from 'react';
import { getActivityCatalogApi } from '../services/api';
import ActivityCard from './ActivityCard';
import { Search, Filter, Compass, AlertCircle, RefreshCw } from 'lucide-react';

const CATEGORIES = ['All', 'Sightseeing', 'Food', 'Adventure', 'Nature', 'Culture', 'Shopping'];

export default function ActivitySearch({ selectedStopCity, onAddActivityClick }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [maxCost, setMaxCost] = useState('');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (query) params.query = query;
      if (selectedStopCity) params.city = selectedStopCity;
      if (category !== 'All') params.category = category;
      if (maxCost) params.maxCost = maxCost;

      const response = await getActivityCatalogApi(params);
      if (response.success) {
        setActivities(response.activities || []);
      }
    } catch (err) {
      console.error('[ActivitySearch fetch error]:', err);
      setError(err.message || 'Failed to load activity catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [query, category, selectedStopCity, maxCost]);

  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div className="badge badge-info" style={{ marginBottom: '0.35rem' }}>
            <Compass style={{ width: 12, height: 12 }} /> Activity Discovery
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            Activities {selectedStopCity ? `in ${selectedStopCity}` : 'Catalog'}
          </h3>
        </div>
      </div>

      {/* Search Bar & Max Cost Filter */}
      <div className="grid grid-cols-1 grid-cols-2 gap-3" style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-dimmed)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities (e.g. Scuba, Food tour, Museum)..."
            style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.6rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>

        <div>
          <input
            type="number"
            value={maxCost}
            onChange={(e) => setMaxCost(e.target.value)}
            placeholder="Max Cost ($)..."
            style={{ width: '100%', padding: '0.65rem 1rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2" style={{ overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        <Filter style={{ width: 14, height: 14, color: 'var(--text-dimmed)', flexShrink: 0 }} />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="btn"
            style={{
              padding: '0.3rem 0.75rem',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-full)',
              background: category === cat ? '#2563eb' : 'rgba(255, 255, 255, 0.06)',
              color: category === cat ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-glass)',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
          <div className="flex items-center gap-2">
            <AlertCircle style={{ width: 16, height: 16 }} />
            <span>{error}</span>
          </div>
          <button onClick={fetchCatalog} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
            <RefreshCw style={{ width: 12, height: 12 }} /> Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-secondary)' }}>
          <Compass className="pulse-glow" style={{ width: 32, height: 32, color: '#3b82f6', margin: '0 auto 0.75rem auto' }} />
          <p style={{ fontSize: '0.85rem' }}>Discovering activities...</p>
        </div>
      ) : activities.length > 0 ? (
        <div className="grid grid-cols-1 grid-cols-2 grid-cols-3 gap-4">
          {activities.map((item) => (
            <ActivityCard
              key={item.id}
              activity={item}
              onAddClick={(act) => onAddActivityClick && onAddActivityClick(act)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)' }}>
          <Compass style={{ width: 36, height: 36, color: 'var(--text-dimmed)', margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No activities found</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Try adjusting your search terms or clearing the category filters.
          </p>
        </div>
      )}
    </div>
  );
}
