import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../src/middleware/auth.middleware';

// Mock jwt module
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock response with json and status functions
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    
    // Setup next function
    nextFunction = jest.fn();
  });

  it('should return 401 if no token is provided', () => {
    // Setup request with no authorization header
    mockRequest = {
      headers: {}
    };

    // Call middleware
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'unauthorized',
      message: 'No token provided'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token verification fails', () => {
    // Setup request with invalid token
    mockRequest = {
      headers: {
        authorization: 'Bearer invalid_token'
      }
    };

    // Mock jwt.verify to fail
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    // Call middleware
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify response
    expect(jwt.verify).toHaveBeenCalledWith('invalid_token', expect.any(String), expect.any(Function));
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'unauthorized',
      message: 'Invalid token'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() and set req.user if token is valid', () => {
    // Mock user data
    const mockUser = { id: 'test-id', role: 'admin' };
    
    // Setup request with valid token
    mockRequest = {
      headers: {
        authorization: 'Bearer valid_token'
      }
    };

    // Mock jwt.verify to succeed
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, mockUser);
    });

    // Call middleware
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify middleware behavior
    expect(jwt.verify).toHaveBeenCalledWith('valid_token', expect.any(String), expect.any(Function));
    expect(mockRequest.user).toEqual(mockUser);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
});