#!/bin/bash

# AWS Manager Script for Book Review App
# ======================================

# Configuration
AWS_HOST="98.86.128.111"
AWS_USER="ubuntu"
APP_DIR="~/book-reviews"
PEM_PATH="/Users/qilu/Documents/Important/book-review-key/book-review-key.pem" # UPDATE THIS with your actual .pem file path

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function for headers
print_header() {
    clear
    echo -e "${BLUE}==============================================${NC}"
    echo -e "${BLUE}   AWS Remote Manager - Book Review App      ${NC}"
    echo -e "${BLUE}==============================================${NC}"
    echo -e "Target: ${GREEN}${AWS_USER}@${AWS_HOST}${NC}"
    echo -e "Key:    ${GREEN}${PEM_PATH}${NC}"
    echo -e "Dir:    ${GREEN}${APP_DIR}${NC}"
    echo ""
}

# Function to run SSH command
run_remote() {
    ssh -i "${PEM_PATH}" -t ${AWS_USER}@${AWS_HOST} "cd ${APP_DIR} && $1"
}

# Main Menu
show_menu() {
    print_header
    echo "1) 🐚 Connect to Shell (SSH)"
    echo "2) 📄 View All Logs (follow)"
    echo "3) 🖥️  View Backend Logs"
    echo "4) 🌐 View Frontend Logs"
    echo "5) 📊 Check Container Status"
    echo "6) 🔄 Restart All Services"
    echo "7) 🛑 Stop All Services"
    echo "q) 🚪 Quit"
    echo ""
    read -p "Select an option: " choice

    case $choice in
        1)
            echo -e "\n${YELLOW}Connecting to shell... (type 'exit' to return)${NC}"
            run_remote "bash --login"
            ;;
        2)
            echo -e "\n${YELLOW}Streaming all logs... (Ctrl+C to exit)${NC}"
            run_remote "docker-compose logs -f"
            ;;
        3)
            echo -e "\n${YELLOW}Streaming backend logs... (Ctrl+C to exit)${NC}"
            run_remote "docker-compose logs -f backend"
            ;;
        4)
            echo -e "\n${YELLOW}Streaming frontend logs... (Ctrl+C to exit)${NC}"
            run_remote "docker-compose logs -f frontend"
            ;;
        5)
            echo -e "\n${YELLOW}Checking status...${NC}"
            run_remote "docker-compose ps"
            read -p "Press Enter to continue..."
            ;;
        6)
            echo -e "\n${YELLOW}Restarting services...${NC}"
            run_remote "docker-compose down && docker-compose up -d"
            echo -e "${GREEN}Services restarted!${NC}"
            read -p "Press Enter to continue..."
            ;;
        7)
            echo -e "\n${RED}Stopping services...${NC}"
            run_remote "docker-compose down"
            echo -e "${GREEN}Services stopped.${NC}"
            read -p "Press Enter to continue..."
            ;;
        q|Q)
            echo "Bye!"
            exit 0
            ;;
        *)
            echo -e "\n${RED}Invalid option${NC}"
            sleep 1
            ;;
    esac
}

# Loop the menu
while true; do
    show_menu
done
