#!/bin/bash

echo "🔍 Debugging Registration 500 Error"
echo "==================================="
echo ""

# Function to test endpoints
test_endpoint() {
    local url=$1
    local method=${2:-GET}
    local data=${3:-}
    
    echo -n "Testing $method $url: "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" -w "\n%{http_code}" "$url" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "HTTP $http_code"
    if [ -n "$body" ]; then
        echo "Response: $body" | head -n2
    fi
}

# Get IP
if [ -f /sys/hypervisor/uuid ] && grep -q "^ec2" /sys/hypervisor/uuid 2>/dev/null; then
    IP=$(curl -s http://checkip.amazonaws.com)
else
    IP="localhost"
fi

echo "📍 Testing on: $IP"
echo ""

echo "1️⃣ Checking if services are running..."
echo "======================================"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(book-review|NAMES)"

echo ""
echo "2️⃣ Testing backend connectivity..."
echo "==================================="
test_endpoint "http://$IP:5001/api/books"
test_endpoint "http://$IP:5001/api/auth/test"

echo ""
echo "3️⃣ Testing registration endpoint..."
echo "===================================="
test_data='{"username":"testuser","email":"test@example.com","password":"password123"}'
test_endpoint "http://$IP:5001/api/auth/register" "POST" "$test_data"

echo ""
echo "4️⃣ Checking backend logs for errors..."
echo "======================================="
echo "Recent errors:"
docker logs book-review-backend 2>&1 | grep -i -E "(error|failed|500)" | tail -10

echo ""
echo "5️⃣ Testing MongoDB connection..."
echo "================================="
docker exec book-review-backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB connection successful'); process.exit(0); })
  .catch(err => { console.log('❌ MongoDB connection failed:', err.message); process.exit(1); });
" 2>&1

echo ""
echo "6️⃣ Checking CORS configuration..."
echo "=================================="
echo "Backend CORS settings:"
docker exec book-review-backend printenv | grep -E "(FRONTEND_URL|CORS)" || echo "No CORS env vars"

echo ""
echo "7️⃣ Testing from frontend container..."
echo "====================================="
docker exec book-review-frontend curl -s http://backend:5001/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}' \
  2>&1 | head -n5

echo ""
echo "8️⃣ Quick fixes to try..."
echo "========================"
echo ""
echo "Fix 1: Restart backend"
echo "docker-compose restart backend"
echo ""
echo "Fix 2: Check MongoDB"
echo "docker logs book-review-db | tail -20"
echo ""
echo "Fix 3: Test with curl directly"
echo 'curl -X POST http://'$IP':5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '"'"'{"username":"testuser","email":"test@example.com","password":"password123"}'"'"
echo ""
echo "Fix 4: Check if /uploads directory exists"
echo "docker exec book-review-backend ls -la /app/uploads/"