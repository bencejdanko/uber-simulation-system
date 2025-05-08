import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

interface SchemaGroup {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

export const validateRequest = (schemas: SchemaGroup) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (schemas.body) {
      const result = schemas.body.parse(req.body);
      req.body = result; // overwrite with parsed data
    }
    if (schemas.query) {
      const result = schemas.query.parse(req.query);
      req.query = result;
    }
    if (schemas.params) {
      const result = schemas.params.parse(req.params);
      req.params = result;
    }

    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      console.error('❌ Zod validation error:', err.issues);
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: err.issues[0]?.message || 'Invalid input',
          details: err.issues,
        },
      });
    }

    // Unexpected error
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error during validation',
      },
    });
  }
};