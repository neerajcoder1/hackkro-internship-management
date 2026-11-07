import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const dbStateMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Controller to report system health and database connectivity.
 * GET /api/health
 */
export const getHealthStatus = asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  const healthData = {
    service: 'HackKro Internship Management API',
    status: isDbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStateMap[dbState] || 'unknown',
      connected: isDbConnected,
    },
  };

  return res.status(200).json(
    new ApiResponse(200, healthData, 'Health check passed successfully')
  );
});
