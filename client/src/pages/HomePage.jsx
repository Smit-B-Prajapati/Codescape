import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkHealth } from '../services/api';
import Navbar from '../components/Navbar';
import { Compass, MapPin, Calendar, DollarSign, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState({ loading: true, online: false, data: null });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkHealth()
      .then((data) => {
        setApiStatus({ loading: false, online: true, data });
      })
      .catch((err) => {
        console.error('API health check error:', err);
        setApiStatus({ loading: false, online: false, data: null });
      });
  }, []);

  const handlePlanTrip = () => {
    if (isAuthenticated) {
      navigate('/plan');
    } else {
      navigate('/signup');
    }
  };

  const handleAiPlanTrip = () => {
    if (isAuthenticated) {
      navigate('/ai-agent');
    } else {
      navigate('/signup', { state: { returnTo: '/ai-agent' } });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Navigation */}
      <Navbar apiStatus={apiStatus} />

      {/* Main Hero Section */}
      <main style={{ flex: 1, padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 4rem auto' }}>
            <div className="badge badge-info" style={{ marginBottom: '1rem', padding: '0.4rem 1rem' }}>
              <Compass style={{ width: 16, height: 16 }} /> Personalized Multi-City Travel Platform
            </div>

            <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: 800 }}>
              Globe<span className="gradient-text">Trotter</span>
            </h1>

            <p style={{ fontSize: '1.6rem', color: '#60a5fa', fontWeight: 600, marginBottom: '1.5rem' }}>
              Plan smarter. Travel better.
            </p>

            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              Welcome to GlobeTrotter — your end-to-end multi-city travel planning hub. Build day-wise itineraries, manage travel budgets, discover activities, and explore world destinations with ease.
            </p>

            <div className="flex justify-center gap-4 flex-wrap">
              <button 
                className="btn btn-primary" 
                style={{
                  padding: '0.85rem 1.75rem',
                  fontSize: '1.05rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #2563eb 100%)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                }}
                onClick={handleAiPlanTrip}
              >
                <Sparkles style={{ width: 18, height: 18 }} />
                <span>Plan with AI</span>
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}
                onClick={handlePlanTrip}
              >
                <span>Manual Planning</span> <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 grid-cols-2 grid-cols-4 gap-6" style={{ marginTop: '3rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', width: 44, height: 44, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <MapPin style={{ color: '#60a5fa' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Multi-City Stops</h3>
              <p style={{ fontSize: '0.9rem' }}>Add multiple travel destinations with customized travel dates and city routes.</p>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', width: 44, height: 44, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Calendar style={{ color: '#34d399' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Day-Wise Itinerary</h3>
              <p style={{ fontSize: '0.9rem' }}>Assign morning, afternoon, and evening activities to specific travel days.</p>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', width: 44, height: 44, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <DollarSign style={{ color: '#fbbf24' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Expense & Budget</h3>
              <p style={{ fontSize: '0.9rem' }}>Calculate estimated trip expenses, categorize costs, and manage budgets.</p>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.15)', width: 44, height: 44, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Compass style={{ color: '#c084fc' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Social Sharing</h3>
              <p style={{ fontSize: '0.9rem' }}>Share public trip links and let fellow travelers clone and customize itineraries.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '2rem 0', borderTop: '1px solid var(--border-glass)', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dimmed)' }}>
        <div className="container flex items-center justify-between">
          <p>© {new Date().getFullYear()} GlobeTrotter Platform. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <CheckCircle2 style={{ width: 16, height: 16, color: '#10b981' }} />
            <span>PART 1 Setup Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
