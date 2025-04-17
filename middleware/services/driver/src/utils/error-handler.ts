import { Response } from 'express';

export const handleError = (res: Response, error: any) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Log the error details (consider using a logger)
    console.error('Error details:', error);

    return res.status(statusCode).json({
        error: {
            code: statusCode,
            message: message,
        },
    });
};

export const notFoundHandler = (res: Response) => {
    return res.status(404).json({
        error: {
            code: 404,
            message: 'Resource not found',
        },
    });
};