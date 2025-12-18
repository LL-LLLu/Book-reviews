#!/bin/bash

echo "🔧 Fixing MongoDB Connection for Docker"
echo "======================================"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Creating from .env.example..."
    cp .env.example .env
fi

# Generate a simple password without special characters
MONGO_PASSWORD=$(openssl rand -hex 16)
echo "✅ Generated new MongoDB password (no special characters)"

# Update .env file
sed -i.bak "s|your-secure-mongo-password-here|$MONGO_PASSWORD|g" .env
sed -i.bak "s|your-secure-mongo-password|$MONGO_PASSWORD|g" .env

# Update backend .env if it exists
if [ -f "backend/.env" ]; then
    echo "MONGODB_URI=mongodb://admin:$MONGO_PASSWORD@mongodb:27017/bookreview?authSource=admin" > backend/.env.tmp
    grep -v "MONGODB_URI" backend/.env >> backend/.env.tmp || true
    mv backend/.env.tmp backend/.env
    echo "✅ Updated backend/.env with Docker MongoDB URI"
fi

echo ""
echo "📝 MongoDB Connection Fixed!"
echo "============================"
echo "MongoDB Password: $MONGO_PASSWORD"
echo ""
echo "🚀 Next Steps:"
echo "1. Rebuild containers: docker-compose down && docker-compose up -d --build"
echo "2. Wait 30 seconds for MongoDB to initialize"
echo "3. Create admin user: docker exec book-review-backend node scripts/createAdmin.js admin@example.com admin admin123"
echo ""