import mongoose from 'mongoose';

declare global {
  var __mongoConnection: Promise<typeof mongoose> | null | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectMongo(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) {
    console.warn('[MongoDB] MONGODB_URI not defined in environment variables. MongoDB features disabled.');
    return null;
  }

  if (global.__mongoConnection) {
    try {
      await global.__mongoConnection;
      return mongoose;
    } catch {
      global.__mongoConnection = null;
    }
  }

  try {
    global.__mongoConnection = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
    });
    await global.__mongoConnection;
    console.info('[MongoDB] Connected to Atlas cluster');
    return mongoose;
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    global.__mongoConnection = null;
    return null;
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export default mongoose;