import React, { useState, useEffect } from 'react';
import { getCitiesApi, getProfileApi, toggleSavedDestinationApi } from '../services/api';
import { Search, MapPin, Star, Plus, DollarSign, Globe, Compass, AlertCircle, Bookmark } from 'lucide-react';

export default function CitySearch({ onSelectCity, tripDates }) {
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [savedCities, setSavedCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCities = async (searchQuery = '') => {
    setLoading(true);
    setError('');
    try {
      const response = await getCitiesApi(searchQuery);
      if (response.success) {
        setCities(response.cities || []);
      }
    } catch (err) {
      console.error('[CitySearch fetch error]:', err);
      setError(err.message || 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities(query);
    getProfileApi()
      .then((res) => {
        if (res.success && res.user?.savedDestinations) {
          setSavedCities(res.user.savedDestinations.map((d) => d.city.toLowerCase()));
        }
      })
      .catch(() => {});
  }, [query]);

  const handleToggleSave = async (cityItem) => {
    try {
      const res = await toggleSavedDestinationApi({
        city: cityItem.city,
        country: cityItem.country,
        image: cityItem.image,
      });
      if (res.success) {
        setSavedCities((res.savedDestinations || []).map((d) => d.city.toLowerCase()));
      }
    } catch (err) {
      console.error('[Toggle save city error]:', err);
    }
  };

  const getCostBadgeClass = (costIndex) => {
    switch (costIndex) {
      case 'Budget': return 'badge-success';
      case 'Moderate': return 'badge-info';
      case 'High': return 'badge-info';
      case 'Luxury': return 'badge-info';
      default: return 'badge-info';
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div className="badge badge-info" style={{ marginBottom: '0.35rem' }}>
            <Compass style={{ width: 12, height: 12 }} /> Destination Discovery
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Search & Discover Cities</h3>
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-dimmed)' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by city (e.g. Mumbai, Goa, Paris, Kyoto, Tokyo)..."
          style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}
        />
      </div>

      {error && (
        <div style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertCircle style={{ width: 16, height: 16 }} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
          <Compass className="pulse-glow" style={{ width: 28, height: 28, color: '#3b82f6', margin: '0 auto 0.5rem auto' }} />
          <p style={{ fontSize: '0.85rem' }}>Searching city database...</p>
        </div>
      ) : cities.length > 0 ? (
        <div className="grid grid-cols-1 grid-cols-2 gap-4">
          {cities.map((item) => {
            const isSaved = savedCities.includes(item.city.toLowerCase());
            return (
              <div key={item.id} className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img
                  src={item.image}
                  alt={item.city}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80';
                  }}
                  style={{ width: 70, height: 70, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex justify-between items-start">
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.city}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSave(item);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem' }}
                        title={isSaved ? "Remove from Saved Destinations" : "Bookmark City to Profile"}
                      >
                        <Bookmark style={{ width: 16, height: 16, color: isSaved ? '#f59e0b' : 'var(--text-dimmed)', fill: isSaved ? '#f59e0b' : 'none' }} />
                      </button>
                      <div className="flex items-center gap-1" style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>
                        <Star style={{ width: 12, height: 12, fill: '#fbbf24' }} />
                        <span>{item.popularity}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    {item.country} • <span style={{ color: 'var(--text-dimmed)' }}>{item.region}</span>
                  </div>

                  <div className="flex justify-between items-center" style={{ marginTop: '0.4rem' }}>
                    <span className={`badge ${getCostBadgeClass(item.costIndex)}`} style={{ fontSize: '0.7rem' }}>
                      {item.costIndex} Cost
                    </span>

                    <button
                      onClick={() => onSelectCity && onSelectCity(item)}
                      className="btn btn-primary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <Plus style={{ width: 12, height: 12 }} />
                      <span>Add to Trip</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No matching cities found for "{query}".
        </div>
      )}
    </div>
  );
}
