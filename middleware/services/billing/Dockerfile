# Use Node.js LTS as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Copy the modified index.js that handles connection failures gracefully
COPY src/index.modified.js src/index.js

# Expose the port the app runs on
EXPOSE 3003

# Set environment variables with default values
ENV MONGODB_URI=mongodb://localhost:27017/uber_simulation \
    BILLING_SERVICE_PORT=3003 \
    KAFKA_BROKER=localhost:9092 \
    REDIS_ENABLED=false \
    REDIS_HOST=localhost \
    REDIS_PORT=6379 \
    JWT_SECRET=your_secret_key \
    NODE_ENV=demo

# Command to run the application
CMD ["node", "src/index.js"]