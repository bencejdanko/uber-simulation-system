import dotenv from 'dotenv';
dotenv.config();

export const config = {
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'supersecretkey',
  redisUrl: process.env.REDIS_URL,
  port: process.env.PORT,
};