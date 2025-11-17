const express = require('express');
const env = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { helmetConfig, corsOptions, generalLimiter } = require('./middleware/security');
const requestLogger = require('./middleware/requestLogger');
const routes = require('./routes');
const swaggerSetup = require('./config/swagger');

// Initialize Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(corsOptions);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Global rate limiting
app.use(generalLimiter);

// Swagger documentation
swaggerSetup(app);

// API routes
app.use(`/api/${env.API_VERSION}`, routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Bubble Backend API',
    version: '1.0.0',
    status: 'running',
    documentation: `/api/${env.API_VERSION}/api-docs`,
    health: `/api/${env.API_VERSION}/health`
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
