import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import config from '../config';
import { IAuth } from '../models/auth.model'; // Adjust import path

// Interfaces for typed payloads
interface AccessTokenPayload {
    sub: string; // userId
    roles: string[];
    iss: string;
}

interface RefreshTokenPayload {
    sub: string; // userId
    // jti?: string; // Optional: JWT ID for revocation
}

// Helper type for user data passed to token generation
type UserTokenData = Pick<IAuth, 'userId' | 'userType'>;

export const generateAccessToken = (user: UserTokenData): string => {
    const payload: AccessTokenPayload = {
        sub: user.userId,
        roles: [user.userType], // Assuming userType maps directly to a role
        iss: config.jwt.issuer,
    };
    const options: SignOptions = {
        expiresIn: parseInt(config.jwt.accessTokenLife, 10),
        
        // expiresIn: config.jwt.accessTokenLife,
        algorithm: 'RS256', // Must match config.jwt.algorithms
        keyid: config.jwt.accessTokenKid,
    };
    // Use the private key string read from the file
    return jwt.sign(payload, config.jwt.accessTokenPrivateKey, options);
};

export const generateRefreshToken = (user: UserTokenData): string => {
    const payload: RefreshTokenPayload = {
        sub: user.userId,
        // jti: uuidv4(), // Optional: Generate unique ID if needed for revocation
    };
    const options: SignOptions = {
        expiresIn: parseInt(config.jwt.accessTokenLife, 10),
        // Algorithm depends on whether REFRESH_TOKEN_SECRET is a symmetric secret or an asymmetric private key
        // algorithm: 'HS256' // If symmetric secret
    };
    return jwt.sign(payload, config.jwt.refreshTokenSecret, options);
};

export const verifyRefreshToken = (token: string): Promise<RefreshTokenPayload> => {
    return new Promise((resolve, reject) => {
        const options: VerifyOptions = {
             issuer: config.jwt.issuer, // Optionally verify issuer if set during signing
            // algorithms: ['HS256'], // Specify if needed
        };
        jwt.verify(token, config.jwt.refreshTokenSecret, options, (err, decoded) => {
            if (err) {
                return reject(err);
            }
            // Type assertion after successful verification
            resolve(decoded as RefreshTokenPayload);
        });
    });
};