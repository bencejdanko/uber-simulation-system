import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'yup';
import { AppError } from './errorHandler';

export const validateRequest = (schema: AnySchema) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await schema.validate({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (err: any) {
    throw new AppError(err.message, 400);
  }
}; 