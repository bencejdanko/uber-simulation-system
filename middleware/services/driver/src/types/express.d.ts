import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedUser;
    }
  }
}

export interface DecodedUser {
  userId: string;
  role: string;
  [key: string]: any;
}