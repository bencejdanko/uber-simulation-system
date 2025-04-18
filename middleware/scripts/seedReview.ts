import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import connectDB from '../config/db';
import Review, { IReview } from '../services/models/review.model';

const seed = async (): Promise<void> => {
  try {
    await connectDB();

    const newReview = new Review({
      _id: 'rev001',
      reviewerId: '987-65-4321',
      revieweeId: '123-45-6789',
      reviewerType: 'customer',
      revieweeType: 'driver',
      rating: 5,
      comment: 'Great ride, very smooth and polite driver!'
    });

    await newReview.save();
    console.log('✅ Review inserted');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding review failed:', (err as Error).message);
    process.exit(1);
  }
};

seed();