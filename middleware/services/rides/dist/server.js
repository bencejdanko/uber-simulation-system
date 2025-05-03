"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/v1', routes_1.routes);
// Error handling
app.use(errorHandler_1.errorHandler);
const PORT = config_1.config.port || 3004;
app.listen(PORT, () => {
    console.log(`Rides service listening on port ${PORT}`);
});
