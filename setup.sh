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

# Set proper permissions (more permissive for Docker)
chmod 777 ./mongodb_data
chmod 777 ./backend/uploads
if [ -d "./backend/uploads/avatars" ]; then
    chmod 777 ./backend/uploads/avatars
fi

echo "✅ Set directory permissions"

# Make sure directories are accessible by any user (Docker container compatibility)
echo "✅ Directories configured for Docker container access"

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