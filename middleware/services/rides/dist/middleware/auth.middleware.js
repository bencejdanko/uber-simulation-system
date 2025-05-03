"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRideAccess = exports.checkRole = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('No token provided', 401);
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errorHandler_1.AppError('Invalid token', 401);
        }
        throw error;
    }
};
exports.verifyToken = verifyToken;
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new errorHandler_1.AppError('Authentication required', 401);
        }
        const hasRole = req.user.roles.some(role => roles.includes(role));
        if (!hasRole) {
            throw new errorHandler_1.AppError('Insufficient permissions', 403);
        }
        next();
    };
};
exports.checkRole = checkRole;
const checkRideAccess = (req, res, next) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Authentication required', 401);
    }
    const rideId = req.params.rideId;
    // This is a placeholder - you'll need to implement the actual check
    // against your database/service to verify if the user has access to this ride
    const hasAccess = true; // Replace with actual check
    if (!hasAccess) {
        throw new errorHandler_1.AppError('Access denied to this ride', 403);
    }
    next();
};
exports.checkRideAccess = checkRideAccess;
