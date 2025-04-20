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