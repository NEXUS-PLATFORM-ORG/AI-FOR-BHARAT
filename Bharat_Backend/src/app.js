import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://bharat-frontend-v2.vercel.app', // Explicitly allow your Vercel deployment
  process.env.FRONTEND_URL,         // set this on Render: your deployed frontend URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(express.json());


app.get('/', (req, res) => {
    res.send('CJ-VAPS Backend Running 🚀');
});

// API Routes
import authRoutes from './modules/auth/auth.route.js';
import profileRoutes from './modules/profile/profile.route.js';
import casesRoutes from './modules/cases/cases.route.js';
import notificationRoutes from './modules/notifications/notification.route.js';
import complianceRoutes from './modules/compliance/compliance.route.js';
import appealsRoutes from './modules/appeals/appeals.route.js';

import usersRoutes from './modules/users/users.route.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/cases', casesRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/appeals', appealsRoutes);

export default app;