#!/bin/bash

echo "======================================="
echo "Restarting Backend on AWS after .env changes"
echo "======================================="
echo ""
echo "IMPORTANT: This script will:"
echo "1. SSH into your AWS EC2 instance"
echo "2. Rebuild and restart the Docker containers"
echo "3. Show the logs to verify it's working"
echo ""
echo "Make sure you have:"
echo "- Updated the .env file locally"
echo "- Committed and pushed changes to git"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# First, push the .env file to AWS
echo ""
echo "Copying .env file to AWS..."
scp /Users/qilu/Code/book-review-app/.env ec2-user@35.173.211.34:~/book-reviews/.env

echo ""
echo "Connecting to AWS and restarting services..."
ssh ec2-user@35.173.211.34 << 'ENDSSH'
cd ~/book-reviews

echo "Current directory: $(pwd)"
echo ""

echo "1. Pulling latest changes from git (if any)..."
git pull || echo "Git pull skipped or failed"
echo ""

echo "2. Stopping current containers..."
docker-compose down
echo ""

echo "3. Rebuilding and starting containers..."
docker-compose up -d --build
echo ""

echo "4. Waiting for services to start (10 seconds)..."
sleep 10
echo ""

echo "5. Checking container status:"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""

echo "6. Backend logs (last 20 lines):"
docker logs book-review-backend --tail 20
echo ""

echo "7. Testing health endpoint:"
curl -s http://localhost:5001/api/health | python3 -m json.tool || echo "Health check failed"
echo ""

echo "Restart complete!"
ENDSSH

echo ""
echo "======================================="
echo "Testing from local machine..."
echo "======================================="
sleep 5

echo "Testing health endpoint from local:"
curl -s http://35.173.211.34:5001/api/health | python3 -m json.tool || echo "Not accessible yet, may need more time to start"