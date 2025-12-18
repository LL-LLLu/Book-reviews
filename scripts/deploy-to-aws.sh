#!/bin/bash

# Deploy to AWS Script
# ====================

# Configuration
AWS_HOST="35.173.211.34"
AWS_USER="ubuntu"
APP_DIR="~/book-reviews"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting deployment to AWS...${NC}"

# Function to run commands on AWS
run_on_aws() {
    ssh ${AWS_USER}@${AWS_HOST} "$1"
}

# Function to copy files to AWS
copy_to_aws() {
    scp "$1" ${AWS_USER}@${AWS_HOST}:"$2"
}

echo -e "${YELLOW}Step 1: Checking AWS server...${NC}"
if ! run_on_aws "echo 'Connected successfully'"; then
    echo -e "${RED}Cannot connect to AWS server${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 2: Pulling latest code...${NC}"
run_on_aws "cd $APP_DIR && git pull origin main"

echo -e "${YELLOW}Step 3: Checking .env file...${NC}"
if run_on_aws "[ -f $APP_DIR/.env ]"; then
    echo -e "${GREEN}✓ .env file exists on server${NC}"
else
    echo -e "${RED}✗ .env file missing on server!${NC}"
    echo ""
    echo "You need to create .env on the AWS server:"
    echo "1. SSH to the server: ssh ${AWS_USER}@${AWS_HOST}"
    echo "2. Navigate to app: cd $APP_DIR"
    echo "3. Create .env: cp .env.example .env"
    echo "4. Edit with your secrets: nano .env"
    echo ""
    read -p "Press Enter after creating .env file on server, or Ctrl+C to exit..."
    
    # Check again
    if ! run_on_aws "[ -f $APP_DIR/.env ]"; then
        echo -e "${RED}Still no .env file found. Exiting.${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}Step 4: Running setup script...${NC}"
run_on_aws "cd $APP_DIR && ./scripts/setup.sh"

echo -e "${YELLOW}Step 5: Building and starting containers...${NC}"
run_on_aws "cd $APP_DIR && docker-compose up -d --build"

echo -e "${YELLOW}Step 6: Checking container status...${NC}"
run_on_aws "cd $APP_DIR && docker-compose ps"

echo -e "${YELLOW}Step 7: Running health check...${NC}"
sleep 10  # Wait for services to start

# Check if services are responding
if curl -s -o /dev/null -w "%{http_code}" "http://${AWS_HOST}:3000" | grep -q "200"; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${RED}✗ Frontend not responding${NC}"
fi

if curl -s -o /dev/null -w "%{http_code}" "http://${AWS_HOST}:5001/api/health" | grep -q "200"; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
else
    echo -e "${RED}✗ Backend API not responding${NC}"
fi

echo ""
echo -e "${GREEN}Deployment completed!${NC}"
echo "Your app should be available at:"
echo "  http://35-173-211-34.nip.io:3000"
echo ""
echo "If there are issues, check logs with:"
echo "  ssh ${AWS_USER}@${AWS_HOST}"
echo "  cd $APP_DIR"
echo "  docker-compose logs -f"