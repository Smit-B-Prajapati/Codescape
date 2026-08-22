# GlobeTrotter — Personalized Travel Planning Platform

GlobeTrotter is a full-stack, production-quality travel planning web application that enables users to create personalized multi-city trips, manage stops and day-wise itineraries, calculate budgets, visualize travel schedules, and discover activities and destinations.

---

## 🛠️ Tech Stack

- **Frontend**: React.js, JavaScript (ES6+), HTML5, Vanilla CSS3 (Custom Design Token System), Lucide React Icons, React Router v6
- **Backend**: Node.js, Express.js
- **Database**: MongoDB & Mongoose
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **Build Tool**: Vite

---

## 📁 Project Architecture

```
GlobeTrotter/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Instructions

### Prerequisites
- **Node.js**: v18+ installed
- **MongoDB**: Community Server running locally or a MongoDB Atlas URI

### Installation & Setup

1. **Environment Setup**:
   Copy `.env.example` to `server/.env`:
   ```bash
   cp .env.example server/.env
   ```

2. **Backend Setup**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   The backend server runs on `http://localhost:5000`.

3. **Frontend Setup**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   The frontend runs on `http://localhost:5173`.

---

## 📈 Development Roadmap Progress

- [x] **PART 1**: Project Setup & Clean Architecture
- [ ] **PART 2**: Database Schema Design & Mongoose Models
- [ ] **PART 3**: Authentication & Security (JWT, bcrypt, Middleware)
- [ ] **PART 4**: Dashboard & Main Navigation
- [ ] **PART 5**: Trip Management (CRUD Operations)
- [ ] **PART 6**: Multi-City Stops & Destination Discovery
- [ ] **PART 7**: Activity Search & Activity Management
- [ ] **PART 8**: Interactive Day-wise Itinerary Builder
- [ ] **PART 9**: Trip Budgeting & Expense Analytics
- [ ] **PART 10**: Timeline & Visual Calendar Interfaces
- [ ] **PART 11**: Public Itinerary Sharing & Copying
- [ ] **PART 12**: Profile & User Preference Management
- [ ] **PART 13**: Admin Dashboard & System Analytics
- [ ] **PART 14**: End-to-End Testing & Security Audit
- [ ] **PART 15**: Production Deployment & Documentation
