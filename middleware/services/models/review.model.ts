import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  _id: string;
  reviewerId: string;
  revieweeId: string;
  reviewerType: string;
  revieweeType: string;
  rating: number;
  comment: string;
  timestamp: Date;
}

const ReviewSchema = new Schema<IReview>({
  _id: { type: String, required: true },
  reviewerId: String,
  revieweeId: String,
  reviewerType: String,
  revieweeType: String,
  rating: Number,
  comment: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IReview>('Review', ReviewSchema);