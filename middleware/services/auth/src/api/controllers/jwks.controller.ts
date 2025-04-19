// src/api/controllers/jwks.controller.ts
import { Request, Response, NextFunction } from 'express';
import config from '../../config';
import jose from 'node-jose'; // Use node-jose or similar

// Define an interface for the JWK structure
interface JWK {
    kty: string;
    use?: string;
    key_ops?: string[];
    alg?: string;
    kid?: string;
    n?: string;
    e?: string;
    [key: string]: any;
}

let jwksCache: any = null; // Simple cache

export const getJwks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!jwksCache) {
             // Convert the PEM public key string from config to JWK format
             const key = await jose.JWK.asKey(config.jwt.accessTokenPublicKey, 'pem');
             
             // Force cast to any then access properties, or extract from raw key format
             const jwkObject = key.toJSON(true) as any; // Use true to get the full key details
             
             // Ensure required fields for verification are present
             jwksCache = {
                 keys: [
                     {
                         kty: jwkObject.kty, // Key Type (e.g., "RSA")
                         use: 'sig', // Usage: signature verification
                         kid: config.jwt.accessTokenKid, // Key ID from config MUST match token
                         alg: 'RS256', // Algorithm MUST match token
                         n: jwkObject.n, // Modulus (Base64URL encoded)
                         e: jwkObject.e, // Exponent (Base64URL encoded)
                     },
                     // Add more keys here if using key rotation
                 ],
             };
        }
        res.status(200).json(jwksCache);
    } catch (error) {
        console.error("Error generating JWKS:", error);
        next(error); // Pass to global error handler
    }
};

// In your main app setup (e.g., app.ts)
// import * as jwksController from './api/controllers/jwks.controller';
// app.get('/.well-known/jwks.json', jwksController.getJwks);