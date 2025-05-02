import dotenv from 'dotenv';
dotenv.config();

export const config = {
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'supersecretkey',
  port: process.env.PORT,
};