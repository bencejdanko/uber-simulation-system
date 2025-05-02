import mongoose from 'mongoose';
import { AppError } from '../middleware/errorHandler';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uber-rides';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new AppError('Database connection failed', 500);
  }
};

export default connectDB; 