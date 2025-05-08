import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

interface JwtPayload {
  userId: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // First check if Kong has already done the JWT validation and passed user info in headers
    const userId = req.headers['x-jwt-claim-sub'] as string;
    const rolesHeader = req.headers['x-jwt-claim-roles'] as string;
    
    if (userId) {
      // Parse roles if available
      let roles: string[] = [];
      if (rolesHeader) {
        try {
          // The header might be JSON formatted
          roles = JSON.parse(rolesHeader);
        } catch (e) {
          // If not JSON, it might be a comma-separated string
          roles = rolesHeader.split(',').map(role => role.trim());
        }
      }
      
      // Set user info from headers
      req.user = {
        userId,
        roles
      };

      req.body.customerId = req.user.userId;
      
      console.log('✅ User authenticated from Kong headers:', req.user);
      return next();
    }
    
    // Fallback to regular JWT validation if Kong headers aren't present
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token) as JwtPayload;
        
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    }
    throw error;
  }
};

export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const hasRole = req.user.roles.some(role => roles.includes(role));
    if (!hasRole) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

export const checkRideAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const rideId = req.params.rideId;
  // This is a placeholder - you'll need to implement the actual check
  // against your database/service to verify if the user has access to this ride
  const hasAccess = true; // Replace with actual check

  if (!hasAccess) {
    throw new AppError('Access denied to this ride', 403);
  }

  next();
};