require('dotenv').config();
const connectDB = require('../config/db');
const Review = require('../services/models/review.model');

const seed = async () => {
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
    console.error('❌ Seeding review failed:', err.message);
    process.exit(1);
  }
};

seed();
