import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkHealth } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageWithFallback from '../components/ImageWithFallback';
import {
  Compass,
  MapPin,
  Calendar,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Globe2,
  Plane,
  Plus,
  Star,
  Search,
  Check,
  TrendingUp,
  Clock,
  Heart,
} from 'lucide-react';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState({ loading: true, online: false, data: null });
  const [searchDestination, setSearchDestination] = useState('');
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchDestination.trim()) {
      handlePlanTrip();
      return;
    }
    if (isAuthenticated) {
      navigate('/plan', { state: { initialName: `Trip to ${searchDestination.trim()}` } });
    } else {
      navigate('/signup', { state: { returnTo: '/plan', initialName: `Trip to ${searchDestination.trim()}` } });
    }
  };

  const handleCuratedDestinationClick = (dest) => {
    if (isAuthenticated) {
      navigate('/plan', { state: { initialName: `Trip to ${dest.city}, ${dest.country}` } });
    } else {
      navigate('/signup', { state: { returnTo: '/plan' } });
    }
  };

  const CURATED_SHOWCASE = [
    {
      city: 'Santorini',
      country: 'Greece',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      category: 'Romantic & Coastal',
      days: '5-7 Days',
      rating: 4.9,
    },
    {
      city: 'Kyoto',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      category: 'Culture & Temples',
      days: '4-6 Days',
      rating: 4.95,
    },
    {
      city: 'Interlaken',
      country: 'Switzerland',
      image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
      category: 'Alpine Adventure',
      days: '6-8 Days',
      rating: 4.92,
    },
    {
      city: 'Amalfi Coast',
      country: 'Italy',
      image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
      category: 'Scenic Cliffside',
      days: '5-7 Days',
      rating: 4.88,
    },
    {
      city: 'Paris',
      country: 'France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
      category: 'Art & Gastronomy',
      days: '4-5 Days',
      rating: 4.85,
    },
    {
      city: 'Bali',
      country: 'Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
      category: 'Tropical Wellness',
      days: '7-10 Days',
      rating: 4.9,
    },
  ];

  const HOW_IT_WORKS = [
    {
      step: '01',
      title: 'Define or Describe Your Dream Trip',
      desc: 'Use conversational natural language with our autonomous AI concierge, or hand-craft your exact dates and destination stops.',
      badge: 'Flexible Planning',
    },
    {
      step: '02',
      title: 'Autonomous Multi-Stop Optimization',
      desc: 'Our engine finds verified real-world trains, flights, and hotels, and schedules unique activities with zero duplicate visits.',
      badge: 'Intelligent Routing',
    },
    {
      step: '03',
      title: 'Seamless Booking & Budget Control',
      desc: 'Review itemized pricing, test-book with bank-grade simulation, and track group expense splits across your itinerary.',
      badge: 'Worry-Free Travel',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      {/* Header Navigation */}
      <Navbar apiStatus={apiStatus} />

      {/* Main Experience */}
      <main style={{ flex: 1 }}>
        {/* Luxury Travel Hero Section */}
        <section
          style={{
            position: 'relative',
            padding: '5.5rem 0 6rem 0',
            overflow: 'hidden',
            borderBottom: '1px solid var(--border-glass)',
          }}
        >
          {/* Subtle Ambient Background Gradients */}
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '980px',
              height: '520px',
              background: 'radial-gradient(circle, rgba(178, 149, 201, 0.22) 0%, rgba(69, 87, 153, 0.12) 45%, rgba(255, 224, 185, 0.08) 70%, transparent 90%)',
              filter: 'blur(75px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
              
              {/* Category Pill */}
              <div
                className="badge badge-lavender"
                style={{
                  marginBottom: '1.4rem',
                  padding: '0.45rem 1.25rem',
                  fontSize: '0.85rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Compass style={{ width: 15, height: 15 }} />
                <span>Next-Generation Multi-City Travel Platform</span>
              </div>

              {/* Editorial Hero Heading */}
              <h1
                className="editorial-display"
                style={{
                  fontSize: 'clamp(2.7rem, 6vw, 4.4rem)',
                  fontWeight: 800,
                  marginBottom: '1.25rem',
                  lineHeight: 1.12,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.025em',
                }}
              >
                Curated Journeys.{' '}
                <span className="gradient-text" style={{ fontStyle: 'italic' }}>
                  Intelligent Travel.
                </span>
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: '1.22rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '2.5rem',
                  lineHeight: '1.68',
                  maxWidth: 720,
                  margin: '0 auto 2.5rem auto',
                }}
              >
                GlobeTrotter pairs autonomous AI route optimization with seamless day-by-day itinerary crafting,
                deterministic budget tracking, and verified real-world transport options.
              </p>

              {/* Interactive Travel Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="glass-card"
                style={{
                  maxWidth: '680px',
                  margin: '0 auto 2.5rem auto',
                  padding: '0.5rem 0.6rem 0.5rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: 'var(--shadow-md), var(--shadow-glow)',
                }}
              >
                <Search style={{ width: 20, height: 20, color: 'var(--primary)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  placeholder="Where would you like to travel? (e.g. Switzerland, Tokyo, Goa, Paris)..."
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    flex: 1,
                    outline: 'none',
                    padding: '0.4rem 0',
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    borderRadius: 'var(--radius-full)',
                    padding: '0.7rem 1.6rem',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                  }}
                >
                  <span>Explore Plan</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </form>

              {/* Call-to-Action Buttons */}
              <div className="flex justify-center gap-4 flex-wrap" style={{ marginBottom: '3rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    padding: '0.95rem 2.2rem',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                  }}
                  onClick={handleAiPlanTrip}
                >
                  <Sparkles style={{ width: 19, height: 19, color: '#FFE0B9' }} />
                  <span>Plan with AI Agent</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    padding: '0.95rem 2rem',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                  }}
                  onClick={handlePlanTrip}
                >
                  <span>Manual Itinerary Builder</span>
                  <ArrowRight style={{ width: 18, height: 18 }} />
                </button>
              </div>

              {/* Trust & Proof Badges */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  padding: '0.65rem 1.5rem',
                  background: 'var(--surface-warm)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 style={{ width: 15, height: 15, color: '#0d9488' }} />
                  <span>Deterministic Budgets</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Globe2 style={{ width: 15, height: 15, color: 'var(--primary)' }} />
                  <span>Multi-City Stop Engine</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck style={{ width: 15, height: 15, color: '#0d9488' }} />
                  <span>Zero-Duplicate Itineraries</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curated Trending Destinations Showcase */}
        <section style={{ padding: '4.5rem 0', backgroundColor: 'var(--bg-canvas)' }}>
          <div className="container">
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginBottom: '2.5rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Destination Inspiration
                </span>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  Trending Escapes for Your Next Journey
                </h2>
              </div>
              <button
                type="button"
                onClick={handlePlanTrip}
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.88rem' }}
              >
                <span>Explore All Cities</span>
                <ArrowRight style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Showcase Grid */}
            <div className="grid grid-cols-1 grid-cols-2 grid-cols-3 gap-6">
              {CURATED_SHOWCASE.map((dest) => (
                <div
                  key={dest.city}
                  onClick={() => handleCuratedDestinationClick(dest)}
                  className="glass-card flex flex-col justify-between"
                  style={{
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'var(--transition-normal)',
                  }}
                >
                  <div style={{ height: '220px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                    <ImageWithFallback src={dest.image} alt={`${dest.city}, ${dest.country}`} />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(16, 24, 47, 0.82)',
                          color: '#FFE0B9',
                          border: '1px solid rgba(255, 224, 185, 0.35)',
                          backdropFilter: 'blur(8px)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {dest.category}
                      </span>
                    </div>

                    <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(16, 24, 47, 0.82)',
                          color: '#FEF5EE',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          backdropFilter: 'blur(8px)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Star style={{ width: 12, height: 12, fill: '#FFE0B9', color: '#FFE0B9' }} />
                        <span>{dest.rating}</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '1.35rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="flex items-center gap-1.5" style={{ marginBottom: '0.35rem' }}>
                        <MapPin style={{ width: 16, height: 16, color: 'var(--primary)' }} />
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, fontWeight: 800 }}>
                          {dest.city},{' '}
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1rem' }}>
                            {dest.country}
                          </span>
                        </h3>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dimmed)' }}>
                        Suggested duration: {dest.days}
                      </span>
                    </div>

                    <div
                      style={{
                        paddingTop: '1rem',
                        marginTop: '1.2rem',
                        borderTop: '1px solid var(--border-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                        Build Custom Itinerary
                      </span>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--btn-secondary-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Plus style={{ width: 16, height: 16, color: 'var(--primary)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How GlobeTrotter Works Concierge Section */}
        <section
          style={{
            padding: '5rem 0',
            borderTop: '1px solid var(--border-glass)',
            backgroundColor: 'var(--surface-warm)',
          }}
        >
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: 740, margin: '0 auto 3.5rem auto' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Editorial Concierge Process
              </span>
              <h2 style={{ fontSize: '2.3rem', fontWeight: 800, marginTop: '0.25rem' }}>
                How GlobeTrotter Reimagines Travel Planning
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.05rem' }}>
                A synthesis of autonomous AI precision and manual creative freedom.
              </p>
            </div>

            <div className="grid grid-cols-1 grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((item) => (
                <div
                  key={item.step}
                  className="glass-card"
                  style={{
                    padding: '2.25rem 2rem',
                    borderRadius: 'var(--radius-md)',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '3rem',
                      fontWeight: 800,
                      color: 'rgba(69, 87, 153, 0.18)',
                      display: 'block',
                      lineHeight: 1,
                      marginBottom: '0.75rem',
                    }}
                  >
                    {item.step}
                  </span>
                  <div
                    className="badge badge-lavender"
                    style={{ marginBottom: '1rem', fontSize: '0.75rem' }}
                  >
                    {item.badge}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section
          style={{
            padding: '5rem 0',
            borderTop: '1px solid var(--border-glass)',
            backgroundColor: 'var(--bg-canvas)',
          }}
        >
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 3.5rem auto' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Comprehensive Platform Architecture
              </span>
              <h2 style={{ fontSize: '2.3rem', fontWeight: 800, marginTop: '0.25rem' }}>
                Engineered for Modern Travel Demands
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.02rem' }}>
                From intelligent multi-stop logistics to budget control, GlobeTrotter unifies your journey under one roof.
              </p>
            </div>

            <div className="grid grid-cols-1 grid-cols-2 grid-cols-4 gap-6">
              <div className="glass-card" style={{ padding: '2rem 1.75rem', borderRadius: 'var(--radius-md)' }}>
                <div
                  style={{
                    background: 'rgba(69, 87, 153, 0.15)',
                    width: 50,
                    height: 50,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    border: '1px solid rgba(69, 87, 153, 0.25)',
                  }}
                >
                  <MapPin style={{ color: 'var(--primary)', width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 800 }}>Multi-City Stops</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Add multiple travel destinations with customized travel dates, transit routes, and flexible leg ordering.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '2rem 1.75rem', borderRadius: 'var(--radius-md)' }}>
                <div
                  style={{
                    background: 'rgba(13, 148, 136, 0.15)',
                    width: 50,
                    height: 50,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    border: '1px solid rgba(13, 148, 136, 0.25)',
                  }}
                >
                  <Calendar style={{ color: '#0d9488', width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 800 }}>Day-Wise Itinerary</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Assign morning, afternoon, and evening activities with realistic pricing and zero duplicate visits across all days.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '2rem 1.75rem', borderRadius: 'var(--radius-md)' }}>
                <div
                  style={{
                    background: 'rgba(217, 119, 6, 0.15)',
                    width: 50,
                    height: 50,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    border: '1px solid rgba(217, 119, 6, 0.25)',
                  }}
                >
                  <DollarSign style={{ color: '#b45309', width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 800 }}>Expense & Budget</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Calculate estimated trip expenses, categorize costs, track spending limits, and balance companion split budgets.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '2rem 1.75rem', borderRadius: 'var(--radius-md)' }}>
                <div
                  style={{
                    background: 'rgba(178, 149, 201, 0.2)',
                    width: 50,
                    height: 50,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    border: '1px solid rgba(178, 149, 201, 0.35)',
                  }}
                >
                  <Compass style={{ color: '#795796', width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 800 }}>Social Sharing & PDF</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Share public trip links, download clean PDF confirmation vouchers, and clone shared itineraries to your account.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* High-Contrast Pre-Footer Callout Section */}
        <section
          style={{
            padding: '5rem 0',
            backgroundColor: '#10182F',
            color: '#FEF5EE',
            borderTop: '1px solid rgba(178, 149, 201, 0.2)',
            position: 'relative',
          }}
        >
          <div className="container" style={{ textAlign: 'center', maxWidth: 760 }}>
            <span
              className="badge"
              style={{
                background: 'rgba(255, 224, 185, 0.15)',
                color: '#FFE0B9',
                border: '1px solid rgba(255, 224, 185, 0.35)',
                marginBottom: '1.25rem',
                fontSize: '0.82rem',
              }}
            >
              <Sparkles style={{ width: 14, height: 14 }} /> Instant Itinerary Generation
            </span>

            <h2
              className="editorial-display"
              style={{
                fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
                fontWeight: 800,
                color: '#FEF5EE',
                marginBottom: '1rem',
                lineHeight: 1.2,
              }}
            >
              Start Planning Your Next Extraordinary Journey Today.
            </h2>

            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.65', marginBottom: '2.5rem' }}>
              Whether you prefer letting our autonomous agent craft an optimized 5-day route or building each day by hand, GlobeTrotter makes travel effortless.
            </p>

            <div className="flex justify-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={handleAiPlanTrip}
                className="btn btn-primary"
                style={{
                  padding: '0.95rem 2.2rem',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                }}
              >
                <Sparkles style={{ width: 19, height: 19, color: '#FFE0B9' }} />
                <span>Launch AI Trip Agent</span>
              </button>

              <button
                type="button"
                onClick={handlePlanTrip}
                className="btn btn-secondary"
                style={{
                  padding: '0.95rem 2rem',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(254, 245, 238, 0.1)',
                  color: '#FEF5EE',
                  borderColor: 'rgba(254, 245, 238, 0.2)',
                }}
              >
                <span>Manual Planning</span>
                <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Global Brand Footer */}
      <Footer />
    </div>
  );
}
