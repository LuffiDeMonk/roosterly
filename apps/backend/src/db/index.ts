import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from cwd and monorepo roots
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let isConnected = false;

/**
 * Defensive sanitizer for MongoDB connection URIs:
 * Detects literal % characters in user passwords not followed by two hex digits
 * and safely encodes them as %25 to prevent MongoDB driver "URI malformed" crashes.
 */
function sanitizeMongoUri(uri: string): string {
  try {
    const trimmed = uri.trim();
    const atIndex = trimmed.lastIndexOf('@');
    const schemeIndex = trimmed.indexOf('://');
    if (atIndex !== -1 && schemeIndex !== -1) {
      const auth = trimmed.slice(schemeIndex + 3, atIndex);
      const colonIndex = auth.indexOf(':');
      if (colonIndex !== -1) {
        const username = auth.slice(0, colonIndex);
        let password = auth.slice(colonIndex + 1);
        // Replace % not followed by two hex digits with %25
        password = password.replace(/%(?![0-9a-fA-F]{2})/g, '%25');
        const rest = trimmed.slice(atIndex);
        return `${trimmed.slice(0, schemeIndex + 3)}${username}:${password}${rest}`;
      }
    }
    return trimmed;
  } catch {
    return uri.trim();
  }
}

const connectDB = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!rawUri) {
    console.warn('⚠️ MONGO_URI (or MONGODB_URI) is not defined in environment variables');
    return;
  }

  const mongoUri = sanitizeMongoUri(rawUri);

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
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
