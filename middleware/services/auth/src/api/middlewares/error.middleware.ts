import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

interface ApiError {
    code: string;
    message: string;
    details?: any;
}

export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[${new Date().toISOString()}] Error on ${req.method} ${req.originalUrl}:`, err); // Log the error

    let statusCode = 500;
    let errorResponse: { error: ApiError } = {
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred.',
        }
    };

    // Handle specific error types
    if (err instanceof ZodError) {
        statusCode = 400;
        errorResponse.error = {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        };
    } else if (err instanceof mongoose.Error.ValidationError) {
         statusCode = 400;
         errorResponse.error = {
             code: 'DATABASE_VALIDATION_ERROR',
             message: 'Database validation failed.',
             details: Object.values(err.errors).map(e => ({ field: e.path, message: e.message })),
         };
    } else if (err instanceof TokenExpiredError) {
        statusCode = 401;
        errorResponse.error = { code: 'TOKEN_EXPIRED', message: 'Token has expired.' };
    } else if (err instanceof JsonWebTokenError) {
        statusCode = 401;
        errorResponse.error = { code: 'INVALID_TOKEN', message: 'Token is invalid.' };
    } else if ((err as any).code === 11000) { // Mongoose duplicate key error
         statusCode = 409; // Conflict
         errorResponse.error = { code: 'DUPLICATE_KEY', message: 'A resource with this identifier already exists.' /* Provide more specific field if possible */ };
    }
    // Add checks for custom application errors here
    // else if (err instanceof YourCustomError) { ... }


    res.status(statusCode).json(errorResponse);
};

// Apply this middleware LAST in your app.ts:
// import { globalErrorHandler } from './api/middlewares/error.middleware';
// app.use(globalErrorHandler);