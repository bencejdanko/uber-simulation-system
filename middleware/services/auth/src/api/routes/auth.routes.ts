// src/api/routes/auth.routes.ts
import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { LoginSchema, RegisterCustomerSchema, RegisterDriverSchema } from '../../schemas/auth.schemas';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Customer registration route
router.post('/register/customer', validate(RegisterCustomerSchema), authController.registerCustomer);

// Driver registration route
router.post('/register/driver', validate(RegisterDriverSchema), authController.registerDriver);

// Login route
router.post('/login', validate(LoginSchema), authController.login);

// Route to generate a token with all roles
router.get('/token/all-roles', authController.generateAllRolesTokenEndpoint);

export default router;