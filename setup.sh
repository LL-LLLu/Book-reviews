#!/bin/bash

# Book Review App - Easy Setup Script
# This script will help you deploy your app quickly

set -e

echo "🚀 Book Review App - Easy Setup"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker and Docker Compose first:"
    echo "https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first:"
    echo "https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env file created${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env file with your configuration${NC}"
        echo "Required settings:"
        echo "  - JWT_SECRET (generate a random string)"
        echo "  - NEXTAUTH_SECRET (generate a random string)" 
        echo "  - MONGO_PASSWORD (set a secure password)"
        echo "  - GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET (optional)"
        echo ""
        read -p "Press Enter to continue after editing .env file..."
    else
        echo -e "${RED}❌ .env.example file not found${NC}"
        exit 1
    fi
fi

# Generate secrets if they're still default
echo "🔐 Checking environment variables..."

if grep -q "your-super-secret-jwt-key" .env; then
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i.bak "s/your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random/$JWT_SECRET/g" .env
    echo -e "${GREEN}✅ Generated JWT_SECRET${NC}"
fi

if grep -q "your-nextauth-secret" .env; then
    NEXTAUTH_SECRET=$(openssl rand -hex 32)
    sed -i.bak "s/your-nextauth-secret-change-this-in-production-make-it-long-and-random/$NEXTAUTH_SECRET/g" .env
    echo -e "${GREEN}✅ Generated NEXTAUTH_SECRET${NC}"
fi

if grep -q "your-secure-mongo-password" .env; then
    MONGO_PASSWORD=$(openssl rand -hex 16)
    sed -i.bak "s/your-secure-mongo-password-here/$MONGO_PASSWORD/g" .env
    sed -i.bak "s/your-secure-mongo-password/$MONGO_PASSWORD/g" .env
    echo -e "${GREEN}✅ Generated MONGO_PASSWORD${NC}"
fi

# Clean up backup files
rm -f .env.bak

echo ""
echo "🏗️  Building and starting containers..."

# Stop any existing containers
docker-compose down 2>/dev/null || true

# Build and start containers
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running!${NC}"
    echo ""
    echo "🎉 Your Book Review App is ready!"
    echo "=================================="
    echo -e "📱 Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "🔧 Backend API: ${BLUE}http://localhost:5001${NC}"
    echo -e "🗄️  Database: ${BLUE}mongodb://localhost:27017${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Visit http://localhost:3000 to see your app"
    echo "2. Register a new account or set up Google OAuth"
    echo "3. Start adding books and writing reviews!"
    echo ""
    echo "🔧 Management Commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop app: docker-compose down"
    echo "  Restart: docker-compose restart"
    echo "  Update: git pull && docker-compose up -d --build"
    echo ""
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    echo "Check logs with: docker-compose logs"
    exit 1
fi