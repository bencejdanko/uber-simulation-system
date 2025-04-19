import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

// This middleware validates against req.body, req.params, and req.query
export const validate = (schema: AnyZodObject) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Parse will throw an error if validation fails
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        // If successful, proceed to the next middleware/handler
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            // Format Zod errors for a user-friendly response
            const errorMessages = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Input validation failed',
                    details: errorMessages,
                },
            });
            return;
        }
        // Handle unexpected errors
        console.error('Error in validation middleware:', error);
        res.status(500).json({
             error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' }
        });
    }
};