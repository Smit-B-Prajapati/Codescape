/**
 * GlobeTrotter API Service Utility
 * Fetch-based API utility with JWT Authorization header injection.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Custom fetch wrapper with automatic JWT token attachment and error handling
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('globetrotter_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`[API Utility Error] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Health & Auth Endpoints
 */
export const checkHealth = () => apiRequest('/health');

export const registerApi = (userData) =>
  apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const loginApi = (credentials) =>
  apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const getMeApi = () => apiRequest('/auth/me');

export const forgotPasswordApi = (emailData) =>
  apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(emailData),
  });

export const getDashboardApi = () => apiRequest('/dashboard');

/**
 * Trip CRUD Endpoints
 */
export const getTripsApi = () => apiRequest('/trips');

export const getTripByIdApi = (id) => apiRequest(`/trips/${id}`);

export const createTripApi = (tripData) =>
  apiRequest('/trips', {
    method: 'POST',
    body: JSON.stringify(tripData),
  });

export const updateTripApi = (id, tripData) =>
  apiRequest(`/trips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tripData),
  });

export const deleteTripApi = (id) =>
  apiRequest(`/trips/${id}`, {
    method: 'DELETE',
  });

/**
 * City Discovery Endpoints
 */
export const getCitiesApi = (searchQuery = '') => {
  const param = searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : '';
  return apiRequest(`/cities${param}`);
};

/**
 * Stops Management Endpoints
 */
export const getStopsByTripApi = (tripId) =>
  apiRequest(`/trips/${tripId}/stops`);

export const addStopApi = (tripId, stopData) =>
  apiRequest(`/trips/${tripId}/stops`, {
    method: 'POST',
    body: JSON.stringify(stopData),
  });

export const updateStopApi = (tripId, stopId, stopData) =>
  apiRequest(`/trips/${tripId}/stops/${stopId}`, {
    method: 'PUT',
    body: JSON.stringify(stopData),
  });

export const deleteStopApi = (tripId, stopId) =>
  apiRequest(`/trips/${tripId}/stops/${stopId}`, {
    method: 'DELETE',
  });

export const reorderStopsApi = (tripId, stopOrders) =>
  apiRequest(`/trips/${tripId}/stops/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ stopOrders }),
  });

/**
 * Activity Discovery & Management Endpoints
 */
export const getActivityCatalogApi = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const queryStr = queryParams ? `?${queryParams}` : '';
  return apiRequest(`/activities/catalog${queryStr}`);
};

export const getActivitiesByTripApi = (tripId) =>
  apiRequest(`/activities/trip/${tripId}`);

export const addActivityToStopApi = (tripId, stopId, activityData) =>
  apiRequest(`/activities/trip/${tripId}/stop/${stopId}`, {
    method: 'POST',
    body: JSON.stringify(activityData),
  });

export const deleteActivityApi = (tripId, activityId) =>
  apiRequest(`/activities/trip/${tripId}/activity/${activityId}`, {
    method: 'DELETE',
  });

/**
 * Itinerary Builder Endpoints
 */
export const getItineraryApi = (tripId) =>
  apiRequest(`/trips/${tripId}/itinerary`);

export const updateActivityApi = (tripId, activityId, activityData) =>
  apiRequest(`/trips/${tripId}/activities/${activityId}`, {
    method: 'PUT',
    body: JSON.stringify(activityData),
  });

/**
 * Budget & Expense Endpoints
 */
export const getBudgetSummaryApi = (tripId) =>
  apiRequest(`/trips/${tripId}/budget`);

export const updateBudgetLimitApi = (tripId, budgetLimit) =>
  apiRequest(`/trips/${tripId}/budget-limit`, {
    method: 'PUT',
    body: JSON.stringify({ budgetLimit }),
  });

export const addExpenseApi = (tripId, expenseData) =>
  apiRequest(`/trips/${tripId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });

export const updateExpenseApi = (tripId, expenseId, expenseData) =>
  apiRequest(`/trips/${tripId}/expenses/${expenseId}`, {
    method: 'PUT',
    body: JSON.stringify(expenseData),
  });

export const deleteExpenseApi = (tripId, expenseId) =>
  apiRequest(`/trips/${tripId}/expenses/${expenseId}`, {
    method: 'DELETE',
  });

/**
 * Public Sharing & Copy Endpoints
 */
export const toggleTripShareApi = (tripId, isPublic) =>
  apiRequest(`/trips/${tripId}/share`, {
    method: 'PUT',
    body: JSON.stringify({ isPublic }),
  });

export const getPublicTripBySlugApi = (slug) =>
  apiRequest(`/trips/public/${slug}`);

export const copyPublicTripApi = (slug) =>
  apiRequest(`/trips/public/${slug}/copy`, {
    method: 'POST',
  });

/**
 * Profile & Settings Endpoints
 */
export const getProfileApi = () => apiRequest('/profile');

export const updateProfileApi = (profileData) =>
  apiRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });

export const toggleSavedDestinationApi = (destinationData) =>
  apiRequest('/profile/saved-destinations', {
    method: 'POST',
    body: JSON.stringify(destinationData),
  });

export const deleteAccountApi = () =>
  apiRequest('/profile/account', {
    method: 'DELETE',
  });

/**
 * Admin Analytics Endpoints
 */
export const getAdminAnalyticsApi = () => apiRequest('/admin/analytics');

export const updateUserRoleApi = (userId, role) =>
  apiRequest(`/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
