#!/bin/bash

echo "==================================="
echo "Backend 500 Error Debug Script"
echo "==================================="
echo ""

# SSH connection details
EC2_HOST="35.173.211.34"
EC2_USER="ec2-user"

echo "Connecting to AWS EC2 instance..."
echo ""

ssh -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST << 'ENDSSH'
echo "1. Checking Docker container status:"
echo "-----------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}"
echo ""

echo "2. Checking backend container logs (last 30 lines):"
echo "---------------------------------------------------"
docker logs book-review-backend --tail 30 2>&1
echo ""

echo "3. Checking MongoDB connection from backend container:"
echo "------------------------------------------------------"
docker exec book-review-backend sh -c 'echo "Testing MongoDB connection..." && node -e "
const mongoose = require(\"mongoose\");
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(\"✓ MongoDB connection successful\");
    process.exit(0);
  })
  .catch(err => {
    console.error(\"✗ MongoDB connection failed:\", err.message);
    process.exit(1);
  });
"' 2>&1
echo ""

echo "4. Checking environment variables in backend container:"
echo "-------------------------------------------------------"
docker exec book-review-backend sh -c 'echo "JWT_SECRET length: $(echo -n $JWT_SECRET | wc -c)" && echo "MONGODB_URI: $MONGODB_URI" | sed "s/:[^:]*@/:****@/"'
echo ""

echo "5. Testing login endpoint directly from container:"
echo "--------------------------------------------------"
docker exec book-review-backend sh -c 'curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}" \
  -w "\nHTTP Status: %{http_code}\n" 2>&1'
echo ""

echo "6. Checking for any Node.js errors in backend:"
echo "----------------------------------------------"
docker exec book-review-backend sh -c 'cat /app/server.js | grep -n "JWT_SECRET" | head -5'
echo ""

echo "7. MongoDB container status:"
echo "----------------------------"
docker logs book-review-db --tail 10 2>&1 | grep -E "error|Error|ERROR|failed|Failed" || echo "No recent MongoDB errors found"
echo ""

echo "8. Checking if .env file is properly loaded:"
echo "--------------------------------------------"
docker exec book-review-backend sh -c 'ls -la /app/.env 2>&1 || echo ".env file not found in container"'
echo ""

echo "Debug complete!"
ENDSSH

echo ""
echo "==================================="
echo "Debug script execution completed"
echo "==================================="