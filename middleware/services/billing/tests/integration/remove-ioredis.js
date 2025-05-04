#!/usr/bin/env node

/**
 * Script to completely remove ioredis from the project
 * This script will:
 * 1. Remove ioredis from package.json
 * 2. Remove ioredis from node_modules
 * 3. Update the index.js file to use a mock Redis client
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Removing ioredis from the project...');

// Path to the project root
const projectRoot = path.resolve(__dirname, '../../');

// 1. Remove ioredis from package.json
try {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.dependencies && packageJson.dependencies.ioredis) {
    console.log('Removing ioredis from package.json...');
    delete packageJson.dependencies.ioredis;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Removed ioredis from package.json');
  } else {
    console.log('ioredis not found in package.json');
  }
} catch (err) {
  console.error('❌ Error updating package.json:', err);
}

// 2. Remove ioredis from node_modules
try {
  const ioredisPath = path.join(projectRoot, 'node_modules', 'ioredis');
  if (fs.existsSync(ioredisPath)) {
    console.log('Removing ioredis from node_modules...');
    fs.rmSync(ioredisPath, { recursive: true, force: true });
    console.log('✅ Removed ioredis from node_modules');
  } else {
    console.log('ioredis not found in node_modules');
  }
} catch (err) {
  console.error('❌ Error removing ioredis from node_modules:', err);
}

// 3. Update the index.js file to use a mock Redis client
try {
  const indexJsPath = path.join(projectRoot, 'src', 'index.js');
  let indexJs = fs.readFileSync(indexJsPath, 'utf8');
  
  // Check if the file imports ioredis
  if (indexJs.includes('require(\'ioredis\')')) {
    console.log('Updating index.js to use a mock Redis client...');
    
    // Replace the Redis import
    indexJs = indexJs.replace(/const\s+Redis\s*=\s*require\(['"]ioredis['"]\);?/, '// Redis import removed for testing');
    
    // Replace the Redis client initialization
    const redisClientRegex = /\/\/ Initialize Redis client[\s\S]*?redisClient\.on\('error'[\s\S]*?\);/;
    const mockRedisClient = `// Initialize Redis client for caching (mock for testing)
let redisClient = null;

// For testing purposes, we're completely disabling Redis
// This prevents connection errors when Redis is not available
console.log('Redis disabled for testing purposes. Continuing without Redis...');

// Mock Redis client methods that might be used in the application
const mockRedisClient = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  exists: async () => 0,
  expire: async () => 1,
  disconnect: () => {}
};

// Use the mock Redis client
redisClient = mockRedisClient;`;
    
    indexJs = indexJs.replace(redisClientRegex, mockRedisClient);
    
    fs.writeFileSync(indexJsPath, indexJs);
    console.log('✅ Updated index.js to use a mock Redis client');
  } else {
    console.log('index.js does not import ioredis');
  }
} catch (err) {
  console.error('❌ Error updating index.js:', err);
}

// 4. Update the pricing.service.js file to use a mock Redis client
try {
  const pricingServicePath = path.join(projectRoot, 'src', 'services', 'pricing.service.js');
  let pricingService = fs.readFileSync(pricingServicePath, 'utf8');
  
  // Check if the file imports ioredis
  if (pricingService.includes('require(\'ioredis\')')) {
    console.log('Updating pricing.service.js to use a mock Redis client...');
    
    // Replace the Redis import and client initialization
    const redisImportRegex = /const\s+Redis\s*=\s*require\(['"]ioredis['"]\);[\s\S]*?port:\s*process\.env\.REDIS_PORT\s*\|\|\s*\d+\s*\}\);/;
    const mockRedisClient = `// Mock Redis client for testing purposes
const redisClient = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  exists: async () => 0,
  expire: async () => 1
};

console.log('Using mock Redis client in pricing service');`;
    
    pricingService = pricingService.replace(redisImportRegex, mockRedisClient);
    
    // Replace the cache lookup code
    const cacheLookupRegex = /\/\/\s*Check if we have a cached surge value[\s\S]*?if\s*\(\s*cachedSurge\s*\)\s*\{[\s\S]*?return parseFloat\(cachedSurge\);[\s\S]*?\}/;
    const mockCacheLookup = `// In testing mode, we skip the cache lookup
    // In a real environment, this would check Redis for cached values
    const cacheKey = \`surge:\${Math.round(location.latitude * 100) / 100}:\${Math.round(location.longitude * 100) / 100}:\${requestTime.getHours()}\`;
    // Mock implementation always returns null for cache lookups
    const cachedSurge = await redisClient.get(cacheKey);
    
    // This will always be false in our mock implementation
    if (cachedSurge) {
      return parseFloat(cachedSurge);
    }`;
    
    pricingService = pricingService.replace(cacheLookupRegex, mockCacheLookup);
    
    // Replace the cache set code
    const cacheSetRegex = /\/\/\s*Cache the surge multiplier[\s\S]*?await\s+redisClient\.set\([\s\S]*?\);/;
    const mockCacheSet = `// Mock caching - in testing mode, this is a no-op
    try {
      await redisClient.set(cacheKey, surgeMultiplier);
    } catch (err) {
      // Ignore cache errors in testing mode
    }`;
    
    pricingService = pricingService.replace(cacheSetRegex, mockCacheSet);
    
    fs.writeFileSync(pricingServicePath, pricingService);
    console.log('✅ Updated pricing.service.js to use a mock Redis client');
  } else {
    console.log('pricing.service.js does not import ioredis');
  }
} catch (err) {
  console.error('❌ Error updating pricing.service.js:', err);
}

// 5. Update the bill.service.js file to use a mock Redis client
try {
  const billServicePath = path.join(projectRoot, 'src', 'services', 'bill.service.js');
  let billService = fs.readFileSync(billServicePath, 'utf8');
  
  // Check if the file imports ioredis
  if (billService.includes('require(\'ioredis\')')) {
    console.log('Updating bill.service.js to use a mock Redis client...');
    
    // Replace the Redis import and client initialization
    const redisImportRegex = /const\s+Redis\s*=\s*require\(['"]ioredis['"]\);[\s\S]*?port:\s*process\.env\.REDIS_PORT\s*\|\|\s*\d+\s*\}\);/;
    const mockRedisClient = `// Mock Redis client for testing purposes
const redisClient = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  exists: async () => 0,
  expire: async () => 1
};

console.log('Using mock Redis client in bill service');`;
    
    billService = billService.replace(redisImportRegex, mockRedisClient);
    
    fs.writeFileSync(billServicePath, billService);
    console.log('✅ Updated bill.service.js to use a mock Redis client');
  } else {
    console.log('bill.service.js does not import ioredis');
  }
} catch (err) {
  console.error('❌ Error updating bill.service.js:', err);
}

console.log('✅ Completed removing ioredis from the project');
console.log('Please run "npm install" to update the node_modules directory');