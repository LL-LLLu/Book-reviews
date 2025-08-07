#!/bin/bash

# Quick Production Deployment Script
# For use when you need to deploy updates quickly

set -e

echo "🚀 Quick Deploy - Book Review App"
echo "================================"

# Pull latest changes
echo "📥 Pulling latest code..."
git pull

# Rebuild and restart containers
echo "🔨 Rebuilding and restarting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Health check
echo "🏥 Running health check..."
if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
fi

echo ""
echo "🎉 Deployment complete!"
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"