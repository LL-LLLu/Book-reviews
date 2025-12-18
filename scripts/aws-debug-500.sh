#!/bin/bash

echo "🔍 AWS 500 Error Debugging"
echo "=========================="
echo ""

# Function to check if we're on EC2
check_ec2() {
    if [ -f /sys/hypervisor/uuid ] && grep -q "^ec2" /sys/hypervisor/uuid 2>/dev/null; then
        return 0
    elif [ -f /sys/devices/virtual/dmi/id/product_uuid ] && grep -qi "^EC2" /sys/devices/virtual/dmi/id/product_uuid 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Get IP (works both locally and on EC2)
if check_ec2; then
    PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
    echo "📍 Running on EC2. Public IP: $PUBLIC_IP"
else
    PUBLIC_IP="localhost"
    echo "📍 Running locally"
fi

echo ""
echo "1️⃣ Checking Docker containers..."
echo "================================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "2️⃣ Checking environment variables..."
echo "===================================="
if [ -f .env ]; then
    echo "URLs in .env:"
    grep -E "(URL|API)" .env | grep -v "^#"
else
    echo "❌ No .env file found!"
fi

echo ""
echo "3️⃣ Testing backend connectivity..."
echo "==================================="
# Test from host
echo -n "From host to backend: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/books || echo "Failed"

# Test from frontend container
echo -n "From frontend to backend: "
docker exec book-review-frontend curl -s -o /dev/null -w "%{http_code}" http://backend:5001/api/books 2>/dev/null || echo "Failed"

echo ""
echo ""
echo "4️⃣ Checking recent error logs..."
echo "================================"
echo "Frontend errors:"
docker logs book-review-frontend 2>&1 | grep -i "error" | tail -5 || echo "No errors found"

echo ""
echo "Backend errors:"
docker logs book-review-backend 2>&1 | grep -i "error" | tail -5 || echo "No errors found"

echo ""
echo "5️⃣ Checking NextAuth configuration..."
echo "====================================="
echo "Frontend environment:"
docker exec book-review-frontend printenv | grep -E "(NEXT|GOOGLE)" | grep -v "SECRET" || echo "No NextAuth vars found"

echo ""
echo "6️⃣ Testing specific endpoints..."
echo "================================"
echo "Testing /api/auth/providers:"
curl -s http://localhost:3000/api/auth/providers | python3 -m json.tool 2>/dev/null || echo "Failed to get providers"

echo ""
echo "7️⃣ Quick fixes to try..."
echo "========================"
echo ""
echo "Fix 1: Update environment and restart"
echo "-------------------------------------"
cat << 'EOF'
# Update .env with your EC2 IP
sed -i "s|localhost|$PUBLIC_IP|g" .env

# Restart containers
docker-compose down
docker-compose up -d --build
EOF

echo ""
echo "Fix 2: Check if MongoDB is initialized"
echo "--------------------------------------"
echo "docker logs book-review-db | grep -i 'waiting for connections'"

echo ""
echo "Fix 3: Create simple test without OAuth"
echo "---------------------------------------"
echo "1. Access: http://$PUBLIC_IP:3000/login-simple"
echo "2. Or register: http://$PUBLIC_IP:3000/register"

echo ""
echo "Fix 4: Manual environment fix"
echo "-----------------------------"
cat << 'EOF'
# Create a production env file
cat > frontend/.env.production.local << EOL
NEXTAUTH_URL=http://$PUBLIC_IP:3000
NEXTAUTH_SECRET=Aa2291718824
NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:5001/api
EOL

# Rebuild frontend
docker-compose up -d --build frontend
EOF

echo ""
echo "8️⃣ Full reset commands..."
echo "========================"
echo "docker-compose down -v"
echo "docker system prune -f"
echo "docker-compose up -d --build"

echo ""
echo "📋 Summary"
echo "=========="
echo "Most common issue: Environment variables still pointing to localhost"
echo "Run this on your EC2: ./fix-aws-500.sh"