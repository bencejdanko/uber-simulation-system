import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DecodedUser } from '../types/express';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'unauthorized', message: 'No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'unauthorized', message: 'Invalid token' });
        }

        req.user = decoded as DecodedUser; // Cast to DecodedUser type
        next();
    });
};

// Add the alias for backward compatibility with existing imports
export const authenticate = authMiddleware;