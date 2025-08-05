#!/bin/bash

# AWS EC2 Quick Setup Script for Book Review App
# Run this script on your EC2 instance after connecting via SSH

set -e

echo "🚀 Book Review App - AWS Setup"
echo "================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Docker
echo -e "${BLUE}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose
echo -e "${BLUE}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Install git
echo -e "${BLUE}📂 Installing Git...${NC}"
sudo apt install git -y

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo -e "${GREEN}🌐 Your EC2 Public IP: ${PUBLIC_IP}${NC}"

# Clone repository
echo -e "${BLUE}📥 Cloning repository...${NC}"
if [ ! -d "book-review-app" ]; then
    read -p "Enter your GitHub repository URL: " REPO_URL
    git clone $REPO_URL book-review-app
fi

cd book-review-app

# Setup environment
echo -e "${BLUE}🔧 Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Generate secure secrets
    JWT_SECRET=$(openssl rand -hex 32)
    NEXTAUTH_SECRET=$(openssl rand -hex 32)
    MONGO_PASSWORD=$(openssl rand -hex 16)
    
    # Update .env file
    sed -i "s|your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random|$JWT_SECRET|g" .env
    sed -i "s|your-nextauth-secret-change-this-in-production-make-it-long-and-random|$NEXTAUTH_SECRET|g" .env
    sed -i "s|your-secure-mongo-password-here|$MONGO_PASSWORD|g" .env
    sed -i "s|your-secure-mongo-password|$MONGO_PASSWORD|g" .env
    
    # Update URLs with public IP
    sed -i "s|http://localhost:3000|http://$PUBLIC_IP:3000|g" .env
    sed -i "s|http://localhost:5001/api|http://$PUBLIC_IP:5001/api|g" .env
    
    echo -e "${GREEN}✅ Environment configured${NC}"
    echo -e "${YELLOW}⚠️  Don't forget to add your Google OAuth credentials to .env${NC}"
fi

# Start Docker in new group
echo -e "${BLUE}🚀 Starting application...${NC}"
sg docker -c "docker-compose up -d --build"

# Wait for services
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 15

# Check status
if sg docker -c "docker-compose ps" | grep -q "Up"; then
    echo -e "${GREEN}✅ Application is running!${NC}"
    echo ""
    echo "🎉 Your Book Review App is deployed on AWS!"
    echo "=========================================="
    echo -e "📱 Frontend: ${BLUE}http://$PUBLIC_IP:3000${NC}"
    echo -e "🔧 Backend API: ${BLUE}http://$PUBLIC_IP:5001${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Visit http://$PUBLIC_IP:3000"
    echo "2. Create your first account"
    echo "3. Set up Google OAuth (optional)"
    echo "4. Start adding books and reviews!"
    echo ""
    echo "🔧 Useful Commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Restart: docker-compose restart"
    echo "  Stop: docker-compose down"
    echo "  Update: git pull && docker-compose up -d --build"
    echo ""
    echo "💡 Pro Tips:"
    echo "- Set up a domain name for professional look"
    echo "- Enable HTTPS with Let's Encrypt"
    echo "- Set up backups for MongoDB"
    echo "- Monitor with AWS CloudWatch"
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    echo "Check logs: docker-compose logs"
fi

# Create auto-start service
echo -e "${BLUE}🔧 Setting up auto-start on reboot...${NC}"
sudo tee /etc/systemd/system/book-review.service > /dev/null <<EOF
[Unit]
Description=Book Review App
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable book-review.service
echo -e "${GREEN}✅ Auto-start enabled${NC}"