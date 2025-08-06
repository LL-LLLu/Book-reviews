#!/bin/bash

# Book Review App - Data Persistence Setup
# This script ensures directories exist with proper permissions for Docker

echo "Setting up directories for persistent data..."

# Create MongoDB data directory
if [ ! -d "./mongodb_data" ]; then
    mkdir -p ./mongodb_data
    echo "✅ Created mongodb_data directory"
fi

# Create uploads directory if it doesn't exist
if [ ! -d "./backend/uploads" ]; then
    mkdir -p ./backend/uploads/avatars
    echo "✅ Created backend/uploads directory"
fi

# Set proper permissions
chmod 755 ./mongodb_data
chmod 755 ./backend/uploads
chmod 755 ./backend/uploads/avatars

echo "✅ Set directory permissions"

# Set ownership to the user running the script (for Docker compatibility)
if [ "$(id -u)" != "0" ]; then
    # Not running as root, which is good for local development
    echo "✅ Running as non-root user (recommended)"
else
    # Running as root, set ownership to Docker user
    chown -R 1000:1000 ./mongodb_data ./backend/uploads
    echo "✅ Set ownership for Docker containers"
fi

echo ""
echo "📋 Data Persistence Setup Complete!"
echo "==================================="
echo "✅ MongoDB data will persist in: ./mongodb_data"
echo "✅ Avatar uploads will persist in: ./backend/uploads"
echo ""
echo "🚀 To start your application:"
echo "   docker-compose up -d --build"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Use 'docker-compose down' to stop (keeps data)"
echo "   - NEVER use 'docker-compose down -v' (deletes data!)"
echo ""