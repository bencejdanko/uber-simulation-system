import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface DecodedUser {
  id: string;
  role: string;
  [key: string]: any;
}