import mongoose from 'mongoose';

/**
 * Connects to MongoDB database using Mongoose.
 * @returns {Promise<typeof mongoose | null>}
 */
export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('[Database] Warning: MONGODB_URI is not defined in environment variables.');
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    // Do not crash server in development if local Mongo is temporarily unreachable,
    // allowing health checks and non-database routes to respond with appropriate status.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB connection disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database] MongoDB runtime error: ${err.message}`);
});
