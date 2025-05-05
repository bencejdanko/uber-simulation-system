const Redis = require('ioredis');

// Create a new Redis client and connect to the Redis server
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  db: process.env.REDIS_DB,
});

// Log Redis connection errors
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Get cached data by key
const get = async (key) => {
  try {
    const data = await redis.get(key); 
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Error getting cache for key ${key}:`, err);
    return null;
  }
};

// Set data in cache with an optional TTL (Time To Live in seconds)
const set = async (key, value, options = {}) => {
  try {
    const { ttl = 3600 } = options;
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error(`Error setting cache for key ${key}:`, err);
  }
};

// Delete cache by key
const del = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`Error deleting cache for key ${key}:`, err);
  }
};

// Graceful shutdown
const quit = async () => {
  await redis.quit();
};

process.on('SIGINT', async () => {
  await quit();
  console.log('Redis connection closed');
  process.exit(0);
});

module.exports = { get, set, del, quit };
