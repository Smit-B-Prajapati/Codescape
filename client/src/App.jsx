import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import MyTrips from './pages/MyTrips';
import CreateTrip from './pages/CreateTrip';
import TripDetails from './pages/TripDetails';
import EditTrip from './pages/EditTrip';
import ItineraryBuilder from './pages/ItineraryBuilder';
import TripBudget from './pages/TripBudget';
import TripCalendar from './pages/TripCalendar';
import PublicTripView from './pages/PublicTripView';
import ProfileSettings from './pages/ProfileSettings';
import AdminDashboard from './pages/AdminDashboard';
import AIAgent from './pages/AIAgent';
import BookingReview from './pages/BookingReview';
import Payment from './pages/Payment';
import BookingConfirmation from './pages/BookingConfirmation';

function RootIndex() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Dashboard /> : <HomePage />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<RootIndex />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/trip/public/:slug" element={<PublicTripView />} />
            <Route path="/trips/public/:slug" element={<PublicTripView />} />
            <Route path="/public/trip/:slug" element={<PublicTripView />} />
            <Route path="/public/trips/:slug" element={<PublicTripView />} />

            {/* Protected User Dashboard & Profile Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Route */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Protected Trip Management Routes */}
            <Route
              path="/trips"
              element={
                <ProtectedRoute>
                  <MyTrips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-agent"
              element={
                <ProtectedRoute>
                  <AIAgent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-planner"
              element={
                <ProtectedRoute>
                  <AIAgent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plan"
              element={
                <ProtectedRoute>
                  <CreateTrip />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/create"
              element={
                <ProtectedRoute>
                  <CreateTrip />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:id"
              element={
                <ProtectedRoute>
                  <TripDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:id/edit"
              element={
                <ProtectedRoute>
                  <EditTrip />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:id/itinerary"
              element={
                <ProtectedRoute>
                  <ItineraryBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:id/budget"
              element={
                <ProtectedRoute>
                  <TripBudget />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:id/calendar"
              element={
                <ProtectedRoute>
                  <TripCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking/:bookingId"
              element={
                <ProtectedRoute>
                  <BookingReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/:bookingId"
              element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking/:bookingId/confirmation"
              element={
                <ProtectedRoute>
                  <BookingConfirmation />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
