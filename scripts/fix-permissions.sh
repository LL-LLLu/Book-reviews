#!/bin/bash

# Fix Permissions Script for Book Review App
# Run this if you encounter permission issues with Docker volumes

echo "🔧 Fixing permissions for Book Review App..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}This script may need sudo privileges to fix permissions.${NC}"
    echo "If you encounter errors, please run: sudo ./scripts/fix-permissions.sh"
    echo ""
fi

# Function to fix directory permissions
fix_directory() {
    local dir=$1
    local description=$2
    
    echo -e "${YELLOW}Fixing $description...${NC}"
    
    if [ ! -d "$dir" ]; then
        echo "Creating $dir..."
        mkdir -p "$dir"
    fi
    
    # Try to change ownership first
    if chown -R $(whoami):$(whoami) "$dir" 2>/dev/null; then
        echo -e "${GREEN}✓ Changed ownership of $dir${NC}"
    else
        # If that fails, try with sudo
        echo "Need sudo to change ownership..."
        sudo chown -R $(whoami):$(whoami) "$dir"
        echo -e "${GREEN}✓ Changed ownership of $dir (with sudo)${NC}"
    fi
    
    # Set permissions
    if chmod -R 777 "$dir" 2>/dev/null; then
        echo -e "${GREEN}✓ Set permissions for $dir${NC}"
    else
        echo "Need sudo to set permissions..."
        sudo chmod -R 777 "$dir"
        echo -e "${GREEN}✓ Set permissions for $dir (with sudo)${NC}"
    fi
}

# Stop containers if running
echo "Checking if containers are running..."
if docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo -e "${YELLOW}Stopping containers to fix permissions...${NC}"
    docker-compose down
    RESTART_NEEDED=true
else
    RESTART_NEEDED=false
fi

# Fix MongoDB data directory
fix_directory "./mongodb_data" "MongoDB data directory"

# Fix uploads directory
fix_directory "./backend/uploads" "uploads directory"

# Create avatars subdirectory if it doesn't exist
if [ ! -d "./backend/uploads/avatars" ]; then
    mkdir -p ./backend/uploads/avatars
    chmod 777 ./backend/uploads/avatars
    echo -e "${GREEN}✓ Created avatars subdirectory${NC}"
fi

# Display current permissions
echo ""
echo "Current permissions:"
echo "-------------------"
ls -la . | grep mongodb_data
ls -la backend/ | grep uploads
if [ -d "./backend/uploads/avatars" ]; then
    echo "  ./backend/uploads/avatars:"
    ls -la backend/uploads/ | grep avatars
fi

# Restart containers if they were running
if [ "$RESTART_NEEDED" = true ]; then
    echo ""
    echo -e "${YELLOW}Restarting containers...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✓ Containers restarted${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Permissions fixed successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "You can now run:"
echo "  docker-compose up -d --build"
echo ""
echo "If you still encounter issues, try:"
echo "  1. Run this script with sudo: sudo ./scripts/fix-permissions.sh"
echo "  2. Restart Docker: sudo systemctl restart docker"
echo "  3. Remove and recreate directories:"
echo "     sudo rm -rf mongodb_data backend/uploads"
echo "     ./setup.sh"