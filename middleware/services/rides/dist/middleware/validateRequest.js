"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const errorHandler_1 = require("./errorHandler");
const validateRequest = (schema) => async (req, res, next) => {
    try {
        await schema.validate({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    }
    catch (err) {
        throw new errorHandler_1.AppError(err.message, 400);
    }
};
exports.validateRequest = validateRequest;
