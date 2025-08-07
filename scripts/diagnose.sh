#!/bin/bash

# Diagnostic Script for Book Review App
# This script helps diagnose container health issues

echo "🔍 Book Review App - Diagnostic Tool"
echo "====================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check which compose file to use
if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo "Using compose file: $COMPOSE_FILE"
echo ""

# Function to check container status
check_container_status() {
    echo -e "${YELLOW}Container Status:${NC}"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
}

# Function to check backend logs
check_backend_logs() {
    echo -e "${YELLOW}Backend Logs (last 50 lines):${NC}"
    docker-compose -f $COMPOSE_FILE logs --tail=50 backend
    echo ""
}

# Function to check MongoDB logs
check_mongo_logs() {
    echo -e "${YELLOW}MongoDB Logs (last 30 lines):${NC}"
    docker-compose -f $COMPOSE_FILE logs --tail=30 mongodb
    echo ""
}

# Function to test MongoDB connection
test_mongo_connection() {
    echo -e "${YELLOW}Testing MongoDB Connection:${NC}"
    
    # Check if MongoDB container is running
    if docker ps | grep -q book-review-db; then
        echo "✓ MongoDB container is running"
        
        # Try to connect to MongoDB
        if docker exec book-review-db mongosh --eval "db.adminCommand('ping')" 2>/dev/null | grep -q "ok"; then
            echo -e "${GREEN}✓ MongoDB is responding to ping${NC}"
        else
            echo -e "${RED}✗ MongoDB is not responding${NC}"
            echo "  Possible issues:"
            echo "  - MongoDB hasn't fully started yet"
            echo "  - Authentication issues"
            echo "  - Database corruption"
        fi
    else
        echo -e "${RED}✗ MongoDB container is not running${NC}"
    fi
    echo ""
}

# Function to check environment variables
check_env_vars() {
    echo -e "${YELLOW}Checking Environment Variables:${NC}"
    
    if [ ! -f ".env" ]; then
        echo -e "${RED}✗ .env file not found!${NC}"
        echo "  Create .env file with required variables"
        return 1
    fi
    
    # Check for required variables
    local required_vars=(
        "MONGO_PASSWORD"
        "JWT_SECRET"
        "NEXTAUTH_SECRET"
        "MONGODB_URI"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            missing_vars+=($var)
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo -e "${GREEN}✓ All required environment variables are present${NC}"
    else
        echo -e "${RED}✗ Missing environment variables:${NC}"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
    fi
    echo ""
}

# Function to check port availability
check_ports() {
    echo -e "${YELLOW}Checking Port Availability:${NC}"
    
    local ports=("3000" "5001" "27017")
    for port in "${ports[@]}"; do
        if lsof -i :$port >/dev/null 2>&1 || netstat -tuln | grep -q ":$port "; then
            echo "✓ Port $port is in use (expected if containers are running)"
        else
            echo "⚠ Port $port is not in use"
        fi
    done
    echo ""
}

# Function to test backend health endpoint
test_backend_health() {
    echo -e "${YELLOW}Testing Backend Health Endpoint:${NC}"
    
    # Wait a moment for backend to be ready
    sleep 2
    
    if curl -f http://localhost:5001/api/health 2>/dev/null; then
        echo ""
        echo -e "${GREEN}✓ Backend health check passed${NC}"
    else
        echo -e "${RED}✗ Backend health check failed${NC}"
        echo "  The backend is not responding on port 5001"
        echo "  Check the backend logs for errors"
    fi
    echo ""
}

# Function to check disk space
check_disk_space() {
    echo -e "${YELLOW}Disk Space:${NC}"
    df -h . | head -2
    echo ""
}

# Function to show Docker resource usage
check_docker_resources() {
    echo -e "${YELLOW}Docker Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    echo ""
}

# Main diagnostic flow
echo "Starting diagnostics..."
echo "========================"
echo ""

check_env_vars
check_container_status
check_ports
test_mongo_connection
check_backend_logs
check_mongo_logs
test_backend_health
check_disk_space
check_docker_resources

# Provide recommendations
echo -e "${YELLOW}=== Recommendations ===${NC}"
echo ""

# Check if backend is unhealthy
if docker-compose -f $COMPOSE_FILE ps | grep -q "unhealthy"; then
    echo -e "${RED}Backend container is unhealthy. Common fixes:${NC}"
    echo ""
    echo "1. Check MongoDB connection:"
    echo "   - Ensure MONGO_PASSWORD in .env matches docker-compose.yml"
    echo "   - Wait for MongoDB to fully start (can take 30-60 seconds)"
    echo ""
    echo "2. Restart services:"
    echo "   docker-compose -f $COMPOSE_FILE restart"
    echo ""
    echo "3. Rebuild containers:"
    echo "   docker-compose -f $COMPOSE_FILE down"
    echo "   docker-compose -f $COMPOSE_FILE up -d --build"
    echo ""
    echo "4. Check for port conflicts:"
    echo "   sudo lsof -i :5001"
    echo "   sudo lsof -i :27017"
    echo ""
    echo "5. Increase health check timeout in docker-compose.prod.yml:"
    echo "   Change 'start_period: 40s' to 'start_period: 60s'"
fi

echo ""
echo "Diagnostics complete!"