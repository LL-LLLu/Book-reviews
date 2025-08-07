#!/bin/bash

# Script to update Docker containers with new credentials from .env file
# This handles the case where .env was updated but containers still use old credentials

echo "==================================="
echo "Book Review App - Credential Update"
echo "==================================="
echo ""
echo "This script will update your containers with new credentials from .env"
echo "WARNING: This will recreate the MongoDB container. Your data will be preserved if using bind mounts."
echo ""
read -p "Do you want to continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Load the new password from .env
source .env

echo ""
echo "Step 1: Stopping all containers..."
docker compose down

echo ""
echo "Step 2: Backing up MongoDB data (just in case)..."
if [ -d "./mongodb_data" ]; then
    backup_dir="mongodb_backup_$(date +%Y%m%d_%H%M%S)"
    cp -r ./mongodb_data $backup_dir
    echo "Backup created in: $backup_dir"
else
    echo "No MongoDB data directory found. Skipping backup."
fi

echo ""
echo "Step 3: Removing old MongoDB container and volumes..."
docker volume rm book-review-app_mongodb_data 2>/dev/null || true

echo ""
echo "Step 4: Rebuilding and starting containers with new credentials..."
docker compose up -d --build

echo ""
echo "Step 5: Waiting for services to be ready..."
sleep 10

echo ""
echo "Step 6: Checking service health..."
echo "MongoDB status:"
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')" 2>/dev/null && echo "✓ MongoDB is running" || echo "✗ MongoDB is not responding"

echo ""
echo "Backend health:"
curl -s http://localhost:5001/api/health > /dev/null 2>&1 && echo "✓ Backend is running" || echo "✗ Backend is not responding"

echo ""
echo "==================================="
echo "Update complete!"
echo "==================================="
echo ""
echo "Your containers have been updated with the new credentials from .env"
echo ""
echo "If you're on AWS EC2, you may need to use your EC2 public IP instead of localhost:"
echo "- Backend: http://35.173.211.34:5001/api/health"
echo "- Frontend: http://35.173.211.34:3000"
echo ""
echo "To view logs:"
echo "  docker compose logs -f"
echo ""
echo "If you encounter issues, restore the backup:"
echo "  docker compose down"
echo "  rm -rf ./mongodb_data"
echo "  mv $backup_dir ./mongodb_data"
echo "  docker compose up -d"