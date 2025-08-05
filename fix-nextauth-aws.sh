#!/bin/bash

echo "🔧 Fixing NextAuth on AWS EC2"
echo "=============================="
echo ""

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "📍 Your EC2 IP: $PUBLIC_IP"
echo ""

# Fix 1: Update main .env file
echo "1️⃣ Updating main .env file..."
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=http://$PUBLIC_IP:3000|g" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://$PUBLIC_IP:3000|g" .env
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:5001/api|g" .env

# Fix 2: Create proper production environment for frontend
echo "2️⃣ Creating frontend production environment..."
cat > frontend/.env.production << EOF
# NextAuth Configuration
NEXTAUTH_URL=http://$PUBLIC_IP:3000
NEXTAUTH_SECRET=Aa2291718824

# API Configuration  
NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:5001/api

# Google OAuth (comment out if not using)
# GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
# GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
EOF

# Fix 3: Update docker-compose to pass NextAuth URL
echo "3️⃣ Checking docker-compose environment..."
if ! grep -q "NEXTAUTH_URL_INTERNAL" docker-compose.yml; then
    echo "   Adding NEXTAUTH_URL_INTERNAL to docker-compose.yml"
    sed -i '/environment:/a\      NEXTAUTH_URL_INTERNAL: http://frontend:3000' docker-compose.yml
fi

# Fix 4: Create a temporary fix for NextAuth
echo "4️⃣ Creating NextAuth configuration override..."
cat > frontend/next-auth-fix.js << 'EOF'
// Temporary NextAuth fix for AWS
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || `http://${process.env.HOSTNAME || 'localhost'}:3000`;
process.env.NEXTAUTH_URL_INTERNAL = process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL;
EOF

# Fix 5: Ensure all services can communicate
echo "5️⃣ Updating service communication..."
cat > docker-compose.override.yml << EOF
version: '3.8'

services:
  frontend:
    environment:
      - NEXTAUTH_URL=http://$PUBLIC_IP:3000
      - NEXTAUTH_URL_INTERNAL=http://frontend:3000
      - NEXTAUTH_SECRET=Aa2291718824
      - NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:5001/api
      
  backend:
    environment:
      - FRONTEND_URL=http://$PUBLIC_IP:3000
      - CORS_ORIGIN=http://$PUBLIC_IP:3000
EOF

echo ""
echo "6️⃣ Rebuilding containers with fixes..."
docker-compose down
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to start (60 seconds)..."
sleep 60

echo ""
echo "7️⃣ Verifying fixes..."
echo "Checking frontend environment:"
docker exec book-review-frontend printenv | grep -E "(NEXTAUTH|NEXT_PUBLIC)" || echo "No env vars found"

echo ""
echo "Checking if services are running:"
docker ps --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "8️⃣ Testing endpoints..."
echo -n "Backend health: "
curl -s -o /dev/null -w "%{http_code}\n" http://$PUBLIC_IP:5001/api/books || echo "Failed"

echo -n "Frontend health: "
curl -s -o /dev/null -w "%{http_code}\n" http://$PUBLIC_IP:3000 || echo "Failed"

echo ""
echo "✅ Fixes applied!"
echo ""
echo "🌐 Your app should now work at:"
echo "   http://$PUBLIC_IP:3000"
echo ""
echo "🔍 If still having issues:"
echo "1. Try the simple login: http://$PUBLIC_IP:3000/login-simple"
echo "2. Check logs: docker logs book-review-frontend -f"
echo "3. Clear browser cache and cookies"
echo "4. Try incognito/private browsing mode"