import mongoose from 'mongoose';

export async function connectToDatabase() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Set it in server/.env.');
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
}
