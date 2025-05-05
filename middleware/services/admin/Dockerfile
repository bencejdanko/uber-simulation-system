# Use the official Node.js image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port 3000 (or the port your app listens on)
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
