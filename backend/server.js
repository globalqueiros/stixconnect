const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const db = require('./config/database');

// Import routes
const triagemRoutes = require('./routes/triagem');
const consultaRoutes = require('./routes/consultas');
const consultasApiRoutes = require('./routes/consultas_api');
const consultasExtendedRoutes = require('./routes/consultas_extended');
const consultasCriarRoutes = require('./routes/consultas-criar');
const zoomRoutes = require('./routes/zoom');
const adminRoutes = require('./routes/admin');
const testRoutes = require('./routes/teste');
const testConsultasRoutes = require('./routes/test-consultas');
const { router: authRoutes, authenticateToken } = require('./routes/auth');
const { router: pacientesAuthRoutes, authenticatePatientToken } = require('./routes/pacientes_auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes - Test one by one
console.log('Loading auth routes...', typeof authRoutes);
app.use('/api/auth', authRoutes);

console.log('Loading triagem routes...', typeof triagemRoutes);
app.use('/api/triagem', triagemRoutes);

console.log('Loading consultas routes...', typeof consultaRoutes);
app.use('/api/consultas', consultaRoutes);

console.log('Loading consultas API routes...', typeof consultasApiRoutes);
app.use('/api/consultas', consultasApiRoutes);

console.log('Loading consultas extended routes...', typeof consultasExtendedRoutes);
app.use('/api/consultas', consultasExtendedRoutes);

console.log('Loading consultas criar routes...', typeof consultasCriarRoutes);
app.use('/api/consultas', consultasCriarRoutes);

console.log('Loading zoom routes...', typeof zoomRoutes);
app.use('/api/zoom', zoomRoutes);

console.log('Loading admin routes...', typeof adminRoutes);
app.use('/api/admin', adminRoutes);

console.log('Loading test routes...', typeof testRoutes);
app.use('/api/teste', testRoutes);

console.log('Loading paciente auth routes...', typeof pacientesAuthRoutes);
app.use('/api/pacientes/auth', pacientesAuthRoutes);

console.log('Loading test consultation routes...', typeof testConsultasRoutes);
app.use('/api/test', testConsultasRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection and server start
async function startServer() {
  try {
    // Only test database if we have valid credentials
    if (process.env.DB_HOST && process.env.DB_USER) {
      try {
        await db.execute('SELECT 1');
        logger.info('Database connected successfully');
      } catch (dbError) {
        logger.warn('Database not available - some features will be limited:', dbError.message);
      }
    } else {
      logger.info('Running without database configuration');
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;