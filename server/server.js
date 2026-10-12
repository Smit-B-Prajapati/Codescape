import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import cityRoutes from './routes/cityRoutes.js';
import stopRoutes from './routes/stopRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import itineraryRoutes from './routes/itineraryRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import publicShareRoutes from './routes/publicShareRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import transportRoutes from './routes/transportRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin === clientUrl ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, origin);
    }
    return callback(null, origin);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection readiness check middleware
app.use('/api', async (req, res, next) => {
  if (
    req.path === '/health' ||
    req.path.startsWith('/transport') ||
    req.path.startsWith('/hotels') ||
    (req.path.startsWith('/agent') && req.path !== '/agent/approve')
  ) {
    return next();
  }
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (_) {}
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Please ensure your MongoDB service is running (e.g. mongodb://127.0.0.1:27017) or set a valid MONGO_URI connection string in server/.env',
    });
  }
  next();
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/trips', publicShareRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/trips/:tripId/stops', stopRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/trips/:tripId', itineraryRoutes);
app.use('/api/trips/:tripId', budgetRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.json({
    app: 'GlobeTrotter API',
    status: 'Active',
    healthCheck: '/api/health'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

import User from './models/User.js';

const seedDemoUsers = async () => {
  try {
    const demoAccounts = [
      { name: 'Smit B Prajapati', email: 'smit200610@gmail.com', password: 'password123', role: 'admin' },
      { name: 'Demo Traveler', email: 'demo@globetrotter.com', password: 'password123', role: 'user' },
    ];
    for (const acc of demoAccounts) {
      const exists = await User.findOne({ email: acc.email });
      if (!exists) {
        await User.create(acc);
        console.log(`[Auto-Seed] Created default user account: ${acc.email} (Password: password123)`);
      }
    }
  } catch (err) {
    console.error('[Auto-Seed Error]:', err.message);
  }
};

const startServer = async () => {
  await connectDB();
  await seedDemoUsers();
  app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(` 🌍 GlobeTrotter Backend Running on Port ${PORT}`);
    console.log(` 📍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(` 🛡️  Admin Dashboard API: http://localhost:${PORT}/api/admin/analytics`);
    console.log(` ⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`===========================================`);
  });
};

startServer();
