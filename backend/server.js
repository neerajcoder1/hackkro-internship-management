import dotenv from 'dotenv';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

// Load environment variables
dotenv.config();

/**
 * Validate critical environment variables before booting
 */
const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required');
  } else if (isProduction && (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('development_jwt_secret'))) {
    errors.push('In production, JWT_SECRET must be a cryptographically secure key of at least 32 characters');
  }

  if (!process.env.MONGODB_URI) {
    errors.push('MONGODB_URI is required');
  }

  if (errors.length > 0) {
    console.error('[Server Config Error] Startup halted due to missing/insecure environment variables:');
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('re_placeholder')) {
    console.warn('[Server Config Warning] RESEND_API_KEY is not configured or using placeholder; automated emails will be skipped.');
  }
};

validateEnv();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP server
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`[Server] HackKro Internship API running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`[Server] Health check endpoint available at: http://localhost:${PORT}/api/health`);
    });

    const handleGracefulShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error(`[Server] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
