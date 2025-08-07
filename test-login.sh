#!/bin/bash

echo "Testing login endpoint on AWS backend"
echo "======================================"
echo ""

# Test with a sample login request
echo "1. Testing login endpoint:"
echo "--------------------------"
curl -X POST http://35.173.211.34:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v 2>&1 | grep -E "HTTP|< |error|Error"

echo ""
echo "2. Testing health endpoint:"
echo "---------------------------"
curl http://35.173.211.34:5001/api/health -s | python3 -m json.tool || echo "Health check failed"

echo ""
echo "3. Testing root endpoint:"
echo "-------------------------"
curl http://35.173.211.34:5001/ -s | python3 -m json.tool || echo "Root endpoint failed"