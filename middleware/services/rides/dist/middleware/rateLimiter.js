"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRateLimiter = exports.veryHighPriorityLimiter = exports.moderatePriorityLimiter = exports.highPriorityLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errorHandler_1 = require("./errorHandler");
// High priority rate limiter (for POST /rides and GET /drivers/nearby)
exports.highPriorityLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limit each IP to 30 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        throw new errorHandler_1.AppError('Too many requests, please try again later', 429);
    }
});
// Moderate priority rate limiter (for GET /rides/{ride_id} and GET /rides)
exports.moderatePriorityLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        throw new errorHandler_1.AppError('Too many requests, please try again later', 429);
    }
});
// Very high priority rate limiter (for GET /drivers/nearby)
exports.veryHighPriorityLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        throw new errorHandler_1.AppError('Too many requests, please try again later', 429);
    }
});
// User-specific rate limiter (for authenticated users)
const userRateLimiter = (maxRequests) => (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: maxRequests, // limit each user to maxRequests per windowMs
    keyGenerator: (req) => {
        var _a;
        // Use user ID from token if available, otherwise fallback to IP
        return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || req.ip || 'unknown';
    },
    message: 'Too many requests from this user, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        throw new errorHandler_1.AppError('Too many requests, please try again later', 429);
    }
});
exports.userRateLimiter = userRateLimiter;
