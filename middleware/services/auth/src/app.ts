// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { globalErrorHandler } from './api/middlewares/error.middleware';
import config from './config';

// Import route handlers
import authRoutes from './api/routes/auth.routes';
import jwksRoutes from './api/routes/jwks.routes';

// Initialize Express app
const app = express();

// Apply global middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(compression()); // Compress responses

// Request logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API routes
const apiBasePath = '/api/v1/auth';
app.use(apiBasePath, authRoutes);

// JWKS endpoint (publicly accessible for token verification)
app.use('/.well-known', jwksRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: { 
      code: 'RESOURCE_NOT_FOUND', 
      message: `Cannot ${req.method} ${req.path}` 
    } 
  });
});

// Global error handler - must be last
app.use(globalErrorHandler);

export default app;