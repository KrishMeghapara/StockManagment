const mongoose = require('mongoose');

/**
 * Connect to MongoDB. This function will attempt to connect but will NOT exit the process
 * on failure. Instead it logs the error so the server can keep running and expose health
 * endpoints even when the database is unavailable.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stock_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    // Don't exit the process here. Let the application keep running and report DB status via health endpoints.
    return false;
  }
};

module.exports = connectDB;
