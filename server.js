require('dotenv').config();
const app = require('./app');
const env = require('./config/env');

const PORT = process.env.PORT || env.PORT || 3000;

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION!', error);
  process.exit(1);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running in ' + env.NODE_ENV + ' mode on port ' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/api/v1/health');
});

process.on('unhandledRejection', (error) => {
  console.error('UNHANDLED REJECTION!', error);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  server.close(() => console.log('Process terminated'));
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  server.close(() => console.log('Process terminated'));
});

module.exports = server;
