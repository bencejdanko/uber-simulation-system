import { Router } from 'express';
import { signupController } from '../controllers/signup.controller';

const router = Router();

// POST /api/v1/signup - For customer/driver signup
router.post('/', signupController.signup);

export default router;