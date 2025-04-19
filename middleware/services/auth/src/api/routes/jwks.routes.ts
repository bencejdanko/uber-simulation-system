// src/api/routes/jwks.routes.ts
import { Router } from 'express';
import * as jwksController from '../controllers/jwks.controller';

const router = Router();

// JWKS endpoint for token verification
router.get('/jwks.json', jwksController.getJwks);

export default router;