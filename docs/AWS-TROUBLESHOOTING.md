# 🔧 AWS Deployment Troubleshooting - 500 Error Fix

## Common Causes of 500 Error on AWS

### 1. Check Environment Variables on AWS

SSH into your EC2 instance and verify the environment:

```bash
# Check what's in your .env file
cat ~/book-review-app/.env

# Check if containers are running
docker ps

# Check frontend environment variables
docker exec book-review-frontend env | grep -E "(NEXT|GOOGLE)"

# Check backend environment variables  
docker exec book-review-backend env | grep -E "(MONGO|JWT|GOOGLE)"
```

### 2. Update URLs for AWS

Your `.env` file on AWS needs to use your EC2 public IP, not localhost:

```bash
cd ~/book-review-app
nano .env
```

Update these values (replace YOUR_EC2_IP with your actual IP):
```env
# Frontend URL (your EC2 public IP)
FRONTEND_URL=http://YOUR_EC2_IP:3000
NEXTAUTH_URL=http://YOUR_EC2_IP:3000

# Backend API URL
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:5001/api

# Keep these the same
MONGO_PASSWORD=Aa2291718824
JWT_SECRET=Aa2291718824
NEXTAUTH_SECRET=Aa2291718824
```

### 3. Check Container Logs

```bash
# Check frontend logs for errors
docker logs book-review-frontend -f

# Check backend logs
docker logs book-review-backend -f

# Check MongoDB logs
docker logs book-review-db -f
```

### 4. Fix NextAuth on AWS

NextAuth needs proper configuration for production. Create this file on your EC2:

```bash
cd ~/book-review-app/frontend
nano .env.production.local
```

Add:
```env
NEXTAUTH_URL=http://YOUR_EC2_IP:3000
NEXTAUTH_SECRET=Aa2291718824
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:5001/api

# If using Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 5. Rebuild with Correct Environment

```bash
# Stop containers
docker-compose down

# Pull latest code
git pull

# Rebuild with new environment
docker-compose up -d --build
```

### 6. Quick Fix Script

Create this script on your EC2 instance:

```bash
#!/bin/bash
# fix-aws-env.sh

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "Your EC2 Public IP: $PUBLIC_IP"

# Update .env file
sed -i "s|localhost|$PUBLIC_IP|g" .env
sed -i "s|127.0.0.1|$PUBLIC_IP|g" .env

# Show updated values
echo "Updated environment:"
grep -E "(URL|API)" .env

# Rebuild
echo "Rebuilding containers..."
docker-compose down
docker-compose up -d --build

echo "Done! Check your app at http://$PUBLIC_IP:3000"
```

### 7. Disable Google OAuth Temporarily

If Google OAuth is causing issues, comment it out in your `.env`:

```env
# GOOGLE_CLIENT_ID=your-id
# GOOGLE_CLIENT_SECRET=your-secret
```

### 8. Test Basic Connectivity

From your EC2 instance:
```bash
# Test if backend is accessible
curl http://localhost:5001/api/auth/test

# Test from container
docker exec book-review-frontend curl http://backend:5001/api/auth/test
```

### 9. CORS Issues

Make sure your backend allows requests from your EC2 IP. Check `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    `http://${process.env.PUBLIC_IP}:3000`,
    process.env.FRONTEND_URL
  ],
  credentials: true
}));
```

### 10. Emergency Admin Creation on AWS

If you need to create an admin user directly:

```bash
# Register a user first through the web interface
# Then make them admin:
docker exec book-review-db mongosh bookreview --eval "db.users.updateOne({email: 'admin@example.com'}, {\$set: {role: 'admin'}})"

# Verify
docker exec book-review-db mongosh bookreview --eval "db.users.find({role: 'admin'}).pretty()"
```

## Most Common Fix

90% of the time, the issue is that the URLs in `.env` still point to localhost. Run this on your EC2:

```bash
cd ~/book-review-app

# Get your public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "Your Public IP: $PUBLIC_IP"

# Update all localhost references
sed -i "s|http://localhost|http://$PUBLIC_IP|g" .env
sed -i "s|NEXTAUTH_URL=http://localhost|NEXTAUTH_URL=http://$PUBLIC_IP|g" .env

# Restart everything
docker-compose down && docker-compose up -d --build

# Wait 1 minute then check
sleep 60
docker ps
```

Your app should now work at `http://YOUR_EC2_IP:3000`!