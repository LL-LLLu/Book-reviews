#!/bin/bash

# Book Review App - Production Deployment Script
# This script handles the deployment process for production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Book Review App - Production Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to check if .env exists
check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}Error: .env file not found!${NC}"
        echo -e "${YELLOW}Please create .env file with production values${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Environment file found${NC}"
}

# Function to validate required environment variables
validate_env() {
    local required_vars=(
        "MONGO_PASSWORD"
        "JWT_SECRET"
        "NEXTAUTH_SECRET"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
        "FRONTEND_URL"
        "NEXTAUTH_URL"
        "NEXT_PUBLIC_API_URL"
        "NEXT_PUBLIC_BASE_URL"
    )
    
    echo -e "${YELLOW}Validating environment variables...${NC}"
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE"; then
            echo -e "${RED}Error: ${var} is not set in .env file${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✓ All required environment variables are set${NC}"
}

# Function to backup current data
backup_data() {
    echo -e "${YELLOW}Creating backup...${NC}"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    # Backup MongoDB if container is running
    if docker ps | grep -q book-review-db; then
        echo "Backing up MongoDB..."
        docker exec book-review-db mongodump --archive="/tmp/backup_${TIMESTAMP}.gz" --gzip
        docker cp "book-review-db:/tmp/backup_${TIMESTAMP}.gz" "${BACKUP_DIR}/mongodb_${TIMESTAMP}.gz"
        echo -e "${GREEN}✓ MongoDB backed up to ${BACKUP_DIR}/mongodb_${TIMESTAMP}.gz${NC}"
    fi
    
    # Backup uploads directory
    if [ -d "./backend/uploads" ]; then
        echo "Backing up uploads..."
        tar -czf "${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz" ./backend/uploads/
        echo -e "${GREEN}✓ Uploads backed up to ${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz${NC}"
    fi
}

# Function to setup directories
setup_directories() {
    echo -e "${YELLOW}Setting up directories...${NC}"
    
    # Create necessary directories
    mkdir -p ./mongodb_data
    mkdir -p ./backend/uploads
    
    # Set permissions
    chmod 755 ./mongodb_data
    chmod 755 ./backend/uploads
    
    echo -e "${GREEN}✓ Directories created and permissions set${NC}"
}

# Function to pull latest code
pull_code() {
    echo -e "${YELLOW}Pulling latest code from git...${NC}"
    
    # Check if git repo
    if [ -d .git ]; then
        git pull origin main || git pull origin master
        echo -e "${GREEN}✓ Code updated${NC}"
    else
        echo -e "${YELLOW}Not a git repository, skipping code pull${NC}"
    fi
}

# Function to deploy application
deploy() {
    echo -e "${YELLOW}Deploying application...${NC}"
    
    # Stop existing containers
    echo "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Remove old images to ensure fresh build
    echo "Removing old images..."
    docker-compose -f "$COMPOSE_FILE" rm -f
    
    # Build and start containers
    echo "Building and starting containers..."
    docker-compose -f "$COMPOSE_FILE" up -d --build
    
    # Wait for services to be healthy
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 10
    
    # Check if services are running
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        echo -e "${GREEN}✓ All services are running${NC}"
    else
        echo -e "${RED}Error: Some services failed to start${NC}"
        docker-compose -f "$COMPOSE_FILE" logs --tail=50
        exit 1
    fi
}

# Function to run health checks
health_check() {
    echo -e "${YELLOW}Running health checks...${NC}"
    
    # Check MongoDB
    if docker exec book-review-db mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ MongoDB is healthy${NC}"
    else
        echo -e "${RED}✗ MongoDB health check failed${NC}"
    fi
    
    # Check Backend
    if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend API is healthy${NC}"
    else
        echo -e "${RED}✗ Backend health check failed${NC}"
    fi
    
    # Check Frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is healthy${NC}"
    else
        echo -e "${RED}✗ Frontend health check failed${NC}"
    fi
}

# Function to show deployment info
show_info() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Deployment Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Services Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Configure your web server (Nginx) to proxy to localhost:3000 and localhost:5001"
    echo "2. Set up SSL certificate with Let's Encrypt"
    echo "3. Update DNS records to point to this server"
    echo "4. Test the application at your domain"
    echo ""
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "Restart services: docker-compose -f $COMPOSE_FILE restart"
    echo "Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "View status: docker-compose -f $COMPOSE_FILE ps"
}

# Main deployment flow
main() {
    echo -e "${YELLOW}Starting deployment process...${NC}"
    
    # Pre-deployment checks
    check_env
    validate_env
    
    # Ask for confirmation
    echo -e "${YELLOW}This will deploy the application to production.${NC}"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
    
    # Deployment steps
    backup_data
    setup_directories
    pull_code
    deploy
    health_check
    show_info
}

# Run main function
main "$@"