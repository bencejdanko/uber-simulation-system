# Use official Node.js LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and lock file
COPY package.json pnpm-lock.yaml ./

# Install dependencies (use pnpm if your project uses it, else npm)
RUN npm install -g pnpm && pnpm install

# Copy the rest of the application code
COPY . .

# Copy shared libs (if not using a monorepo build context)
# (If your Docker build context is the whole monorepo, this is not needed.)

# Expose the port (match your .env or server config)
EXPOSE 5000

# Start the service
CMD ["pnpm", "start"]