# Backend Dockerfile
FROM node:18-alpine

# Install dependencies for bcrypt
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production && npm rebuild bcrypt --build-from-source

# Copy app source
COPY . .

# Create uploads directory
RUN mkdir -p uploads/avatars

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/ || exit 1

# Start the application
CMD ["npm", "start"]