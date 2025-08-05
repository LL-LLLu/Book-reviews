#!/bin/bash

echo "🔧 Creating Admin User via Docker"
echo "================================="

# Check if email, username, and password are provided
if [ $# -lt 3 ]; then
    echo "Usage: ./create-admin-docker.sh <email> <username> <password>"
    echo "Example: ./create-admin-docker.sh admin@example.com admin admin123"
    exit 1
fi

EMAIL=$1
USERNAME=$2
PASSWORD=$3

echo "📋 User Details:"
echo "  Email: $EMAIL"
echo "  Username: $USERNAME"
echo ""

# Option 1: Try using the direct connection script
echo "🚀 Method 1: Attempting direct connection..."
docker cp backend/scripts/createAdminDirect.js book-review-backend:/tmp/
docker exec book-review-backend node /tmp/createAdminDirect.js "$EMAIL" "$USERNAME" "$PASSWORD"

if [ $? -eq 0 ]; then
    echo "✅ Admin user created successfully!"
    exit 0
fi

echo ""
echo "❌ Method 1 failed. Trying alternative method..."
echo ""

# Option 2: Create user through MongoDB directly
echo "🚀 Method 2: Creating user directly in MongoDB..."

# First, let's create a simple user without auth
docker exec book-review-db mongosh bookreview --eval "
db.users.insertOne({
  username: '$USERNAME',
  email: '$EMAIL',
  password: '\$2a\$10\$DUMMY_HASH_WILL_BE_REPLACED',
  role: 'admin',
  passwordSetup: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
"

echo ""
echo "⚠️  IMPORTANT: User created but password needs to be set!"
echo ""
echo "To set the password:"
echo "1. Go to http://localhost:3000/login"
echo "2. Click 'Forgot Password' (when implemented)"
echo "3. OR update the password hash manually"
echo ""
echo "Alternative: Register normally and then run:"
echo "docker exec book-review-db mongosh bookreview --eval \"db.users.updateOne({email: '$EMAIL'}, {\\$set: {role: 'admin'}})\""