import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DecodedUser } from '../types/express.d';
import config from '../config';

const SECRET_KEY = config.jwtSecret;

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'unauthorized', message: 'No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded: any) => {
        if (err) {
            return res.status(401).json({ error: 'unauthorized', message: 'Invalid token' });
        }

        // Support both token formats: id field from test token and userId from regular token
        req.user = {
            userId: decoded.userId || decoded.id,
            role: decoded.role
        } as DecodedUser;
        
        next();
    });
};

// Optional middleware that allows routes to check if authentication is present
// but still proceed with the request if no token is present
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        next();
        return;
    }

    jwt.verify(token, SECRET_KEY, (err, decoded: any) => {
        if (!err) {
            req.user = {
                userId: decoded.userId || decoded.id,
                role: decoded.role
            } as DecodedUser;
        }
        next();
    });
};

// Add the alias for backward compatibility with existing imports
export const authenticate = authMiddleware;