import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// High priority rate limiter (for POST /rides and GET /drivers/nearby)
export const highPriorityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    throw new AppError('Too many requests, please try again later', 429);
  }
});

// Moderate priority rate limiter (for GET /rides/{ride_id} and GET /rides)
export const moderatePriorityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    throw new AppError('Too many requests, please try again later', 429);
  }
});

// Very high priority rate limiter (for GET /drivers/nearby)
export const veryHighPriorityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    throw new AppError('Too many requests, please try again later', 429);
  }
});

// User-specific rate limiter (for authenticated users)
export const userRateLimiter = (maxRequests: number) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: maxRequests,
    keyGenerator: (req: Request) => {
      // Use user ID from token as the key, fallback to IP
      const userId = req.user?.userId;
      return userId ? userId : req.ip;
    },
    message: 'Too many requests from this user, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response, next: NextFunction) => {
      throw new AppError('Too many requests, please try again later', 429);
    }
  });
}; 