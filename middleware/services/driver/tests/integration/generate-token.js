#!/usr/bin/env node

/**
 * JWT Token Generator for Integration Tests
 * 
 * This script generates a valid JWT token for use in integration tests.
 * It uses the same secret as the driver service for compatibility.
 */

const dotenv = require('dotenv');
const path = require('path');
// Load environment variables from service directory .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const jwt = require('jsonwebtoken');

// Get the JWT secret from environment or use default (should match auth middleware)
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

// Create a token that will be valid for 1 hour
const token = jwt.sign(
  { 
    id: 'test-admin-id', 
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 3600 // Token expires in 1 hour
  }, 
  SECRET_KEY
);

// Output the token
console.log(token);