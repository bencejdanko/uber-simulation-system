"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const ride_routes_1 = require("./ride.routes");
const router = (0, express_1.Router)();
exports.routes = router;
router.use('/rides', ride_routes_1.rideRoutes);
