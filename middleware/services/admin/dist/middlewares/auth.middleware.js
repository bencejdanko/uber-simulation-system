"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        if (!decoded.roles || !decoded.roles.includes('admin')) {
            return res.status(403).json({ error: 'forbidden', message: 'Admin privileges required' });
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'unauthorized', message: 'Invalid token' });
    }
}
