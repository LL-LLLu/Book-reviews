#!/bin/bash

echo "🔧 Fixing Avatar URLs on AWS"
echo "==========================="
echo ""

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || echo "35.173.211.34")
echo "📍 Your EC2 Public IP: $PUBLIC_IP"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
fi

# Add NEXT_PUBLIC_BASE_URL if missing
if ! grep -q "NEXT_PUBLIC_BASE_URL" .env; then
    echo "Adding NEXT_PUBLIC_BASE_URL to .env..."
    echo "" >> .env
    echo "# Backend Base URL (for static files like avatars)" >> .env
    echo "NEXT_PUBLIC_BASE_URL=http://$PUBLIC_IP:5001" >> .env
else
    echo "Updating NEXT_PUBLIC_BASE_URL..."
    sed -i "s|NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=http://$PUBLIC_IP:5001|g" .env
fi

# Update all other URLs
echo "Updating all URLs to use $PUBLIC_IP..."
sed -i "s|http://localhost:3000|http://$PUBLIC_IP:3000|g" .env
sed -i "s|http://localhost:5001|http://$PUBLIC_IP:5001|g" .env

echo ""
echo "📋 Current configuration:"
grep -E "(URL|API|BASE)" .env | grep -v "^#"

echo ""
echo "🔄 Rebuilding frontend with new environment..."
docker-compose up -d --build frontend

echo ""
echo "⏳ Waiting for frontend to start (30 seconds)..."
sleep 30

echo ""
echo "✅ Fix applied!"
echo ""
echo "🌐 Your avatar URLs should now work properly:"
echo "   - Frontend: http://$PUBLIC_IP:3000"
echo "   - Backend: http://$PUBLIC_IP:5001"
echo "   - Avatars: http://$PUBLIC_IP:5001/uploads/avatars/"
echo ""
echo "💡 Test by:"
echo "1. Visiting http://$PUBLIC_IP:3000"
echo "2. Going to Settings → Profile"
echo "3. Uploading a new avatar"