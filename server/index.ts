import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { testConnection } from './db';
import { initializeTables } from './db/init';
import authRoutes from './routes/auth';
import companyRoutes from './routes/companies';
import applicationRoutes from './routes/applications';
import jobBoardRoutes from './routes/jobBoards';
import tagvaluesRoutes from './routes/tagValues';

dotenv.config();

const app = express();

// Environment variables
const SERVER_PORT = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret'; // still usable in routes

// Middleware
app.use(cors());
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'ks012A[}1a:>7fc',
    resave: false,
    saveUninitialized: false,
    // 1 hour
    cookie: { maxAge: 3600000 },
  })
);

// Initialize database
(async () => {
  await testConnection();
  await initializeTables();
})();

// Root endpoint
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Mount routes
app.use('/auth', authRoutes);
app.use('/companies', companyRoutes);
app.use('/applications', applicationRoutes);
app.use('/job-boards', jobBoardRoutes);
app.use('/tagvalues', tagvaluesRoutes);

// Start server
app.listen(SERVER_PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${SERVER_PORT}`);
  console.log(`See at http://localhost:${SERVER_PORT}/`);
});