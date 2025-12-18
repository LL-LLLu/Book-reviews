#!/bin/bash

echo "🔧 Fixing 500 Error on AWS EC2"
echo "=============================="

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || echo "YOUR_EC2_IP")
echo "📍 Your EC2 Public IP: $PUBLIC_IP"
echo ""

# Check if we're on EC2
if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "YOUR_EC2_IP" ]; then
    echo "❌ Could not detect public IP. Please run this on your EC2 instance."
    echo "   Or manually replace YOUR_EC2_IP in the .env file"
    exit 1
fi

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backed up .env file"

# Update all localhost references to public IP
echo "🔄 Updating environment variables..."
sed -i "s|http://localhost:3000|http://$PUBLIC_IP:3000|g" .env
sed -i "s|http://localhost:5001|http://$PUBLIC_IP:5001|g" .env
sed -i "s|FRONTEND_URL=http://localhost|FRONTEND_URL=http://$PUBLIC_IP|g" .env
sed -i "s|NEXTAUTH_URL=http://localhost|NEXTAUTH_URL=http://$PUBLIC_IP|g" .env
sed -i "s|NEXT_PUBLIC_API_URL=http://localhost|NEXT_PUBLIC_API_URL=http://$PUBLIC_IP|g" .env

# Ensure passwords are set correctly
sed -i "s|MONGO_PASSWORD=.*|MONGO_PASSWORD=Aa2291718824|g" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=Aa2291718824|g" .env
sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=Aa2291718824|g" .env

echo ""
echo "📋 Updated Configuration:"
echo "========================"
grep -E "(URL|API|SECRET|PASSWORD)" .env | grep -v "#"
echo ""

# Create frontend production env if needed
if [ ! -f frontend/.env.production.local ]; then
    echo "NEXTAUTH_URL=http://$PUBLIC_IP:3000" > frontend/.env.production.local
    echo "NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:5001/api" >> frontend/.env.production.local
    echo "NEXTAUTH_SECRET=Aa2291718824" >> frontend/.env.production.local
    echo "✅ Created frontend/.env.production.local"
fi

echo ""
echo "🐳 Restarting Docker containers..."
docker-compose down
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to start (60 seconds)..."
sleep 60

# Check if services are running
echo ""
echo "🔍 Checking services:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📊 Checking logs for errors:"
echo "============================"
echo "Frontend logs:"
docker logs book-review-frontend --tail 10 2>&1 | grep -i error || echo "No errors found"
echo ""
echo "Backend logs:"
docker logs book-review-backend --tail 10 2>&1 | grep -i error || echo "No errors found"

echo ""
echo "✅ Fix applied! Your app should now be working."
echo ""
echo "🌐 Access your app at:"
echo "   http://$PUBLIC_IP:3000"
echo ""
echo "🔧 If still having issues:"
echo "1. Check full logs: docker logs book-review-frontend -f"
echo "2. Test backend: curl http://$PUBLIC_IP:5001/api/books"
echo "3. Check security groups in AWS console (ports 3000, 5001 open?)"
echo ""
echo "📝 To create an admin user:"
echo "1. Register at http://$PUBLIC_IP:3000/register"
echo "2. Run: docker exec book-review-db mongosh bookreview --eval \"db.users.updateOne({email: 'your@email.com'}, {\\$set: {role: 'admin'}})\""