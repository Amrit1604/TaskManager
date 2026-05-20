/**
 * server.js — Entry point for the Task Manager API
 *
 * Boot sequence:
 *  1. Load env vars and validate required ones
 *  2. Register global middleware (helmet, cors, cookie-parser, json parser)
 *  3. Mount API routes
 *  4. Attach 404 and global error handlers
 *  5. Connect to DB then start listening
 */
require('dotenv').config();
const { validateEnv } = require('./src/config/env');
validateEnv(); // Fails fast if any required env var is missing

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { connectDB } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const userRoutes = require('./src/routes/userRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security ──────────────────────────────────────────────────
// Helmet sets various security-related HTTP headers
app.use(helmet());

// CORS: only allow requests from the frontend origin
// Credentials: true is required for cookies to be sent cross-origin
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Body & Cookie Parsing ─────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:id/tasks', taskRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/users',    userRoutes);

// Audit log route for a project
const authenticate = require('./src/middleware/authenticate');
const TaskController = require('./src/controllers/taskController');
app.get('/api/projects/:id/audit', authenticate, TaskController.getProjectAudit);

// ── Error Handling for API ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
})();
