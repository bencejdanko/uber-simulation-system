FROM node:22-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install

# Copy the rest of the application code
COPY . .

# Copy the .env file
# (Removed since we now configure this from the docker-compose file)
# COPY .env ./

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "serve"]