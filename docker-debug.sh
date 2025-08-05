#!/bin/bash

echo "🔍 Docker Debugging Script"
echo "========================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check running containers
echo "📦 Current containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}"
echo ""

# Check port usage
echo "🔌 Port availability:"
for port in 3000 5001 27017; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port $port is already in use"
        lsof -Pi :$port -sTCP:LISTEN
    else
        echo "✅ Port $port is available"
    fi
done
echo ""

# Check resources
echo "💾 System resources:"
echo "Memory: $(free -h | grep Mem | awk '{print $3 " used of " $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 " used of " $2 " (" $5 " full)"}')"
echo ""

# Try to start in background
echo "🚀 Starting containers in background..."
docker-compose down 2>/dev/null
docker-compose up -d

# Wait and check
sleep 10
echo ""
echo "📊 Container status after startup:"
docker-compose ps

echo ""
echo "📝 Recent logs:"
echo "MongoDB:"
docker logs book-review-db --tail 5 2>&1 | head -10
echo ""
echo "Backend:"
docker logs book-review-backend --tail 5 2>&1 | head -10
echo ""
echo "Frontend:"
docker logs book-review-frontend --tail 5 2>&1 | head -10

echo ""
echo "✅ Debugging complete!"
echo ""
echo "Tips:"
echo "- Use 'docker-compose up -d' to run in background"
echo "- Use 'docker-compose logs -f' to view logs"
echo "- Use 'docker-compose down' to stop all containers"