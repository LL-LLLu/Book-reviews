#!/bin/bash

echo "🔧 Fixing Backend Issues"
echo "======================="
echo ""

echo "1️⃣ Checking MongoDB container status..."
if ! docker ps | grep -q book-review-db; then
    echo "❌ MongoDB container not running. Starting it..."
    docker-compose up -d mongodb
    echo "⏳ Waiting for MongoDB to start (30 seconds)..."
    sleep 30
else
    echo "✅ MongoDB container is running"
fi

echo ""
echo "2️⃣ Checking MongoDB logs..."
echo "Recent MongoDB logs:"
docker logs book-review-db --tail 10

echo ""
echo "3️⃣ Testing MongoDB connectivity from backend..."
docker exec book-review-backend ping -c 2 mongodb || echo "❌ Cannot reach mongodb container"

echo ""
echo "4️⃣ Checking Docker network..."
docker network ls | grep book-review
echo ""
echo "Containers on the network:"
docker network inspect book-review-network --format '{{range .Containers}}{{.Name}} - {{.IPv4Address}}{{println}}{{end}}' 2>/dev/null || echo "Network inspection failed"

echo ""
echo "5️⃣ Restarting services in correct order..."
echo "Stopping all containers..."
docker-compose down

echo "Starting MongoDB first..."
docker-compose up -d mongodb

echo "Waiting for MongoDB to be ready (45 seconds)..."
sleep 45

echo "Checking if MongoDB is accepting connections..."
timeout 10 docker exec book-review-db mongosh --eval "db.admin.ismaster()" || echo "MongoDB not ready yet"

echo "Starting backend..."
docker-compose up -d backend

echo "Waiting for backend to connect (15 seconds)..."
sleep 15

echo "Starting frontend..."
docker-compose up -d frontend

echo ""
echo "6️⃣ Final status check..."
echo "========================"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "7️⃣ Testing connectivity..."
echo "=========================="
echo -n "Backend health: "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5001/api/books || echo "Failed"

echo -n "MongoDB from backend: "
docker exec book-review-backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {serverSelectionTimeoutMS: 5000})
  .then(() => console.log('✅ Connected'))
  .catch(() => console.log('❌ Failed'));
setTimeout(() => process.exit(), 6000);
" 2>/dev/null

echo ""
echo "📋 If still having issues:"
echo "1. Check: docker logs book-review-db"
echo "2. Check: docker logs book-review-backend"
echo "3. Try: docker-compose down -v && docker-compose up -d --build"