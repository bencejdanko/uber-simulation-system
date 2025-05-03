"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rideValidator = exports.cancelRideSchema = exports.findNearbyDriversSchema = exports.listRidesSchema = exports.getRideSchema = exports.createRideSchema = exports.validateRequest = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const joi_1 = __importDefault(require("joi"));
const zod_1 = require("zod");
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const { error } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            next();
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError) {
                throw error;
            }
            throw new errorHandler_1.AppError('Invalid request data', 400);
        }
    };
};
exports.validateRequest = validateRequest;
const locationSchema = joi_1.default.object({
    latitude: joi_1.default.number().required(),
    longitude: joi_1.default.number().required()
});
exports.createRideSchema = zod_1.z.object({
    body: zod_1.z.object({
        pickupLocation: zod_1.z.object({
            latitude: zod_1.z.number().min(-90).max(90),
            longitude: zod_1.z.number().min(-180).max(180)
        }),
        dropoffLocation: zod_1.z.object({
            latitude: zod_1.z.number().min(-90).max(90),
            longitude: zod_1.z.number().min(-180).max(180)
        }),
        vehicleType: zod_1.z.enum(['STANDARD', 'PREMIUM', 'LUXURY']),
        paymentMethod: zod_1.z.enum(['CASH', 'CREDIT_CARD', 'PAYPAL']),
        estimatedFare: zod_1.z.number().positive().optional()
    })
});
exports.getRideSchema = zod_1.z.object({
    params: zod_1.z.object({
        rideId: zod_1.z.string().uuid()
    })
});
exports.listRidesSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
        for_customer_id: zod_1.z.string().uuid().optional(),
        for_driver_id: zod_1.z.string().uuid().optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional()
    })
});
exports.findNearbyDriversSchema = zod_1.z.object({
    query: zod_1.z.object({
        latitude: zod_1.z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number),
        longitude: zod_1.z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number),
        radius: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('5000')
    })
});
exports.cancelRideSchema = zod_1.z.object({
    params: zod_1.z.object({
        rideId: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        reason: zod_1.z.string().min(1).max(500).optional()
    })
});
exports.rideValidator = {
    createRide: {
        body: {
            passengerId: 'string',
            pickupLocation: {
                latitude: 'number',
                longitude: 'number',
            },
            dropoffLocation: {
                latitude: 'number',
                longitude: 'number',
            },
        },
    },
    findNearbyDrivers: {
        query: {
            latitude: 'number',
            longitude: 'number',
            radius: 'number',
        },
    },
};
