#!/bin/bash

# Alternative fix: Update only backend container with correct credentials
# This preserves MongoDB data and avoids recreating the database

echo "==================================="
echo "Book Review App - Credential Fix"
echo "==================================="
echo ""
echo "This script will fix credential mismatches between your .env and containers"
echo "Choose your approach:"
echo ""
echo "1) Keep current MongoDB password, update .env to match (SAFER - no data risk)"
echo "2) Force MongoDB to use new password from .env (requires container recreation)"
echo ""
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "Option 1: Syncing .env with existing MongoDB password"
        echo "======================================================"
        echo ""
        echo "You'll need to know the ORIGINAL password that MongoDB is currently using."
        echo "This was the password in your .env file when you first created the containers."
        echo ""
        read -p "Enter the ORIGINAL MongoDB password: " original_password
        
        # Create a backup of current .env
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo "Created backup: .env.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Update the .env file with the original password
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/MONGO_PASSWORD=.*/MONGO_PASSWORD=$original_password/" .env
            sed -i '' "s|MONGODB_URI=.*|MONGODB_URI=mongodb://admin:$original_password@mongodb:27017/bookreview?authSource=admin|" .env
        else
            # Linux
            sed -i "s/MONGO_PASSWORD=.*/MONGO_PASSWORD=$original_password/" .env
            sed -i "s|MONGODB_URI=.*|MONGODB_URI=mongodb://admin:$original_password@mongodb:27017/bookreview?authSource=admin|" .env
        fi
        
        echo ""
        echo "Updated .env with original password"
        echo ""
        echo "Rebuilding backend with correct credentials..."
        docker compose up -d --build backend
        
        echo ""
        echo "Waiting for backend to restart..."
        sleep 5
        
        ;;
        
    2)
        echo ""
        echo "Option 2: Force MongoDB to use new password from .env"
        echo "======================================================"
        echo ""
        echo "WARNING: This will recreate the MongoDB container!"
        echo "Your data should be preserved if you're using bind mounts (./mongodb_data)"
        echo ""
        read -p "Are you SURE you want to continue? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            echo "Cancelled."
            exit 1
        fi
        
        # Run the update script
        bash ./update-credentials.sh
        
        ;;
        
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "Testing backend connection..."
sleep 3

# Test the backend
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/health 2>/dev/null)

if [ "$response" = "200" ]; then
    echo "✅ Backend is working correctly!"
    echo ""
    echo "You should now be able to login."
else
    echo "⚠️ Backend is still not responding correctly (HTTP $response)"
    echo ""
    echo "Check the logs for more details:"
    echo "  docker compose logs backend"
    echo ""
    echo "Common issues:"
    echo "- Wrong MongoDB password in .env"
    echo "- MongoDB container not fully started"
    echo "- Network connectivity issues"
fi

echo ""
echo "To monitor logs:"
echo "  docker compose logs -f backend"