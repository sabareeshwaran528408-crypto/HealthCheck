import cors from 'cors';
import express from 'express';
import checklistRoutes from './routes/checklistRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { supabaseAuthMiddleware } from './middleware/supabaseAuth.js';
import { testDatabaseConnection } from './config/db.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await testDatabaseConnection();
    res.json({
      success: true,
      message: 'HealthCheck API is running',
      database: 'connected',
    });
  } catch (error) {
    console.error('Database health check failed:', error.code || error.name);
    res.status(503).json({
      success: false,
      message: 'HealthCheck API is running, but the database is unavailable.',
      database: 'disconnected',
    });
  }
});

app.use('/api/checklist', supabaseAuthMiddleware, checklistRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/progress', supabaseAuthMiddleware, progressRoutes);
app.use('/api/reminders', supabaseAuthMiddleware, reminderRoutes);
app.use('/api/notifications', supabaseAuthMiddleware, notificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  res.status(status).json({
    success: false,
    message: status === 400 ? 'Invalid request body' : 'An unexpected server error occurred',
  });
});

export default app;
