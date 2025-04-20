// filepath: /home/bence/uber-simulation-system/middleware/config/db.ts
import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI as string;
    console.log("Connecting using URI:", uri); // Debug

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    } as mongoose.ConnectOptions);

    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', (err as Error).message);
    process.exit(1);
  }
};

export default connectDB;