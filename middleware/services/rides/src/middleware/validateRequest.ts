import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'yup';
import { AppError } from './errorHandler';

export const validateRequest = (schema: AnySchema) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 Validating request with schema:', schema.describe());
    console.log('📄 Request body for validation:', JSON.stringify(req.body, null, 2));
    
    // Instead of validating against {body, query, params}, just validate the body directly
    await schema.validate(req.body);
    
    console.log('✅ Validation passed');
    return next();
  } catch (err: any) {
    console.error('❌ Validation failed:', err.errors);
    // throw new AppError(err.message, 400);
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.errors[0],
        details: err.errors,
      },
    });
  }
};