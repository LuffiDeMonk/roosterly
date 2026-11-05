import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn('⚠️ MONGO_URI is not defined in environment variables');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    // Only hard exit in local dev, avoid killing serverless processes
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
