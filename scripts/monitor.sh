#!/bin/bash

# Book Review App - Monitoring Script
# This script monitors the application health and restarts if needed

set -e  # Exit on error

# Configuration
LOG_FILE="/var/log/book-review-monitor.log"
COMPOSE_FILE="docker-compose.prod.yml"
MAX_RETRIES=3
RETRY_DELAY=30
ALERT_EMAIL="admin@yourdomain.com"  # Configure your email
SLACK_WEBHOOK=""  # Configure your Slack webhook if using

# Colors for console output (won't appear in logs)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send alert
send_alert() {
    local level=$1
    local message=$2
    
    log_message "ALERT [$level]: $message"
    
    # Email alert (configure mail first)
    # echo "$message" | mail -s "Book Review App Alert: $level" "$ALERT_EMAIL"
    
    # Slack alert
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Book Review App Alert [$level]: $message\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null
    fi
}

# Function to check container health
check_container() {
    local container_name=$1
    local service_name=$2
    
    if docker ps | grep -q "$container_name"; then
        # Container is running, check if it's healthy
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
        
        if [ "$health_status" = "healthy" ] || [ "$health_status" = "none" ]; then
            return 0
        else
            log_message "WARNING: $service_name container is unhealthy (status: $health_status)"
            return 1
        fi
    else
        log_message "ERROR: $service_name container is not running"
        return 1
    fi
}

# Function to check service endpoints
check_endpoints() {
    local all_healthy=true
    
    # Check MongoDB
    if docker exec book-review-db mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log_message "✓ MongoDB is responding"
    else
        log_message "✗ MongoDB is not responding"
        all_healthy=false
    fi
    
    # Check Backend API
    if curl -f -m 5 http://localhost:5001/api/health > /dev/null 2>&1; then
        log_message "✓ Backend API is responding"
    else
        log_message "✗ Backend API is not responding"
        all_healthy=false
    fi
    
    # Check Frontend
    if curl -f -m 5 http://localhost:3000 > /dev/null 2>&1; then
        log_message "✓ Frontend is responding"
    else
        log_message "✗ Frontend is not responding"
        all_healthy=false
    fi
    
    if [ "$all_healthy" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    local threshold=90  # Alert if disk usage is above 90%
    
    local usage=$(df / | grep / | awk '{ print $5 }' | sed 's/%//g')
    
    if [ "$usage" -gt "$threshold" ]; then
        send_alert "WARNING" "Disk space is running low: ${usage}% used"
        return 1
    else
        log_message "Disk space OK: ${usage}% used"
        return 0
    fi
}

# Function to check memory usage
check_memory() {
    local threshold=90  # Alert if memory usage is above 90%
    
    local total_mem=$(free | grep Mem | awk '{print $2}')
    local used_mem=$(free | grep Mem | awk '{print $3}')
    local usage=$((used_mem * 100 / total_mem))
    
    if [ "$usage" -gt "$threshold" ]; then
        send_alert "WARNING" "Memory usage is high: ${usage}%"
        return 1
    else
        log_message "Memory OK: ${usage}% used"
        return 0
    fi
}

# Function to check Docker stats
check_docker_stats() {
    log_message "Docker container statistics:"
    
    # Get container stats
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | while read line; do
        log_message "$line"
    done
}

# Function to restart services
restart_services() {
    local service=$1
    
    log_message "Attempting to restart $service..."
    
    if [ "$service" = "all" ]; then
        docker-compose -f "$COMPOSE_FILE" restart
    else
        docker-compose -f "$COMPOSE_FILE" restart "$service"
    fi
    
    # Wait for services to come up
    sleep 30
    
    # Check if restart was successful
    if check_endpoints; then
        log_message "✓ Services restarted successfully"
        send_alert "INFO" "Services were restarted and are now healthy"
        return 0
    else
        log_message "✗ Services still unhealthy after restart"
        return 1
    fi
}

# Function to perform recovery
perform_recovery() {
    log_message "Starting recovery procedure..."
    
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        retry_count=$((retry_count + 1))
        log_message "Recovery attempt $retry_count of $MAX_RETRIES"
        
        # Try restarting services
        if restart_services "all"; then
            log_message "✓ Recovery successful"
            return 0
        fi
        
        # Wait before next retry
        log_message "Waiting ${RETRY_DELAY} seconds before retry..."
        sleep $RETRY_DELAY
    done
    
    log_message "✗ Recovery failed after $MAX_RETRIES attempts"
    send_alert "CRITICAL" "Application recovery failed! Manual intervention required."
    return 1
}

# Function to collect diagnostics
collect_diagnostics() {
    local diag_file="/tmp/book-review-diagnostics-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Book Review App Diagnostics Report"
        echo "Generated: $(date)"
        echo "=================================="
        echo ""
        echo "Container Status:"
        docker-compose -f "$COMPOSE_FILE" ps
        echo ""
        echo "Container Logs (last 50 lines):"
        echo "--- MongoDB ---"
        docker logs --tail 50 book-review-db 2>&1
        echo ""
        echo "--- Backend ---"
        docker logs --tail 50 book-review-backend 2>&1
        echo ""
        echo "--- Frontend ---"
        docker logs --tail 50 book-review-frontend 2>&1
        echo ""
        echo "System Information:"
        echo "--- Disk Usage ---"
        df -h
        echo ""
        echo "--- Memory Usage ---"
        free -h
        echo ""
        echo "--- Docker Stats ---"
        docker stats --no-stream
        echo ""
        echo "--- Network Connections ---"
        netstat -tuln | grep -E ":(3000|5001|27017)"
    } > "$diag_file"
    
    log_message "Diagnostics collected: $diag_file"
    
    # Optionally upload or email diagnostics
    # cat "$diag_file" | mail -s "Book Review App Diagnostics" "$ALERT_EMAIL"
}

# Main monitoring loop
main() {
    log_message "========================================="
    log_message "Book Review App Monitoring Check"
    log_message "========================================="
    
    # Change to application directory
    cd /home/ubuntu/book-review-app || {
        log_message "ERROR: Could not change to application directory"
        send_alert "CRITICAL" "Cannot access application directory"
        exit 1
    }
    
    # Track overall health
    HEALTH_STATUS="HEALTHY"
    ISSUES=()
    
    # Check disk space
    if ! check_disk_space; then
        HEALTH_STATUS="WARNING"
        ISSUES+=("Low disk space")
    fi
    
    # Check memory
    if ! check_memory; then
        HEALTH_STATUS="WARNING"
        ISSUES+=("High memory usage")
    fi
    
    # Check containers
    if ! check_container "book-review-db" "MongoDB"; then
        HEALTH_STATUS="CRITICAL"
        ISSUES+=("MongoDB container issue")
    fi
    
    if ! check_container "book-review-backend" "Backend"; then
        HEALTH_STATUS="CRITICAL"
        ISSUES+=("Backend container issue")
    fi
    
    if ! check_container "book-review-frontend" "Frontend"; then
        HEALTH_STATUS="CRITICAL"
        ISSUES+=("Frontend container issue")
    fi
    
    # Check service endpoints
    if ! check_endpoints; then
        HEALTH_STATUS="CRITICAL"
        ISSUES+=("Service endpoints not responding")
    fi
    
    # Check Docker stats
    check_docker_stats
    
    # Take action based on health status
    case $HEALTH_STATUS in
        "HEALTHY")
            log_message "✓ All systems operational"
            ;;
        "WARNING")
            log_message "⚠ System warnings detected: ${ISSUES[*]}"
            send_alert "WARNING" "System warnings: ${ISSUES[*]}"
            ;;
        "CRITICAL")
            log_message "✗ Critical issues detected: ${ISSUES[*]}"
            send_alert "CRITICAL" "Critical issues: ${ISSUES[*]}"
            
            # Collect diagnostics
            collect_diagnostics
            
            # Attempt recovery
            perform_recovery
            ;;
    esac
    
    log_message "Monitoring check completed"
    log_message "========================================="
}

# Run main function
main "$@"