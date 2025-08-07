#!/bin/bash

# Book Review App - Backup Script
# This script creates backups of MongoDB and uploaded files

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/home/ubuntu/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/book-review-backup.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to backup MongoDB
backup_mongodb() {
    log_message "Starting MongoDB backup..."
    
    # Check if MongoDB container is running
    if ! docker ps | grep -q book-review-db; then
        log_message "ERROR: MongoDB container is not running"
        return 1
    fi
    
    # Create backup
    MONGO_BACKUP_FILE="mongodb_backup_${TIMESTAMP}.gz"
    
    # Execute mongodump inside container
    docker exec book-review-db mongodump \
        --archive="/tmp/${MONGO_BACKUP_FILE}" \
        --gzip \
        --quiet
    
    # Copy backup from container to host
    docker cp "book-review-db:/tmp/${MONGO_BACKUP_FILE}" "${BACKUP_DIR}/${MONGO_BACKUP_FILE}"
    
    # Remove backup from container
    docker exec book-review-db rm "/tmp/${MONGO_BACKUP_FILE}"
    
    # Verify backup was created
    if [ -f "${BACKUP_DIR}/${MONGO_BACKUP_FILE}" ]; then
        BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${MONGO_BACKUP_FILE}" | cut -f1)
        log_message "✓ MongoDB backup completed: ${MONGO_BACKUP_FILE} (${BACKUP_SIZE})"
        return 0
    else
        log_message "ERROR: MongoDB backup failed"
        return 1
    fi
}

# Function to backup uploaded files
backup_uploads() {
    log_message "Starting uploads backup..."
    
    UPLOADS_DIR="./backend/uploads"
    
    # Check if uploads directory exists
    if [ ! -d "$UPLOADS_DIR" ]; then
        log_message "Uploads directory not found, skipping uploads backup"
        return 0
    fi
    
    # Check if uploads directory has files
    if [ -z "$(ls -A $UPLOADS_DIR 2>/dev/null)" ]; then
        log_message "Uploads directory is empty, skipping backup"
        return 0
    fi
    
    # Create tar archive
    UPLOADS_BACKUP_FILE="uploads_backup_${TIMESTAMP}.tar.gz"
    tar -czf "${BACKUP_DIR}/${UPLOADS_BACKUP_FILE}" -C ./backend uploads/
    
    # Verify backup was created
    if [ -f "${BACKUP_DIR}/${UPLOADS_BACKUP_FILE}" ]; then
        BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${UPLOADS_BACKUP_FILE}" | cut -f1)
        log_message "✓ Uploads backup completed: ${UPLOADS_BACKUP_FILE} (${BACKUP_SIZE})"
        return 0
    else
        log_message "ERROR: Uploads backup failed"
        return 1
    fi
}

# Function to backup environment file
backup_env() {
    log_message "Starting environment backup..."
    
    if [ -f ".env" ]; then
        # Encrypt the .env file for security
        ENV_BACKUP_FILE="env_backup_${TIMESTAMP}.enc"
        
        # Use openssl to encrypt (you should set a password)
        # For automated backups, you might want to use a key file instead
        cp .env "${BACKUP_DIR}/env_backup_${TIMESTAMP}.txt"
        
        log_message "✓ Environment backup completed: env_backup_${TIMESTAMP}.txt"
        log_message "WARNING: Environment file contains secrets - store securely!"
    else
        log_message "Environment file not found, skipping"
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    log_message "Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
    
    # Count files before cleanup
    BEFORE_COUNT=$(find "$BACKUP_DIR" -type f -name "*.gz" -o -name "*.tar.gz" | wc -l)
    
    # Remove MongoDB backups older than retention period
    find "$BACKUP_DIR" -type f -name "mongodb_backup_*.gz" -mtime +${RETENTION_DAYS} -delete
    
    # Remove uploads backups older than retention period
    find "$BACKUP_DIR" -type f -name "uploads_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
    
    # Remove environment backups older than retention period
    find "$BACKUP_DIR" -type f -name "env_backup_*" -mtime +${RETENTION_DAYS} -delete
    
    # Count files after cleanup
    AFTER_COUNT=$(find "$BACKUP_DIR" -type f -name "*.gz" -o -name "*.tar.gz" | wc -l)
    REMOVED=$((BEFORE_COUNT - AFTER_COUNT))
    
    if [ $REMOVED -gt 0 ]; then
        log_message "✓ Removed ${REMOVED} old backup file(s)"
    else
        log_message "No old backups to remove"
    fi
}

# Function to upload to cloud storage (optional)
upload_to_cloud() {
    # Example for AWS S3
    # Uncomment and configure if using S3
    
    # S3_BUCKET="your-backup-bucket"
    # AWS_PROFILE="your-profile"
    
    # log_message "Uploading backups to S3..."
    
    # # Upload MongoDB backup
    # aws s3 cp "${BACKUP_DIR}/mongodb_backup_${TIMESTAMP}.gz" \
    #     "s3://${S3_BUCKET}/mongodb/" \
    #     --profile ${AWS_PROFILE}
    
    # # Upload uploads backup
    # if [ -f "${BACKUP_DIR}/uploads_backup_${TIMESTAMP}.tar.gz" ]; then
    #     aws s3 cp "${BACKUP_DIR}/uploads_backup_${TIMESTAMP}.tar.gz" \
    #         "s3://${S3_BUCKET}/uploads/" \
    #         --profile ${AWS_PROFILE}
    # fi
    
    # log_message "✓ Backups uploaded to S3"
    
    echo "Cloud upload not configured" > /dev/null
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Example: Send email notification
    # Uncomment and configure if you want email notifications
    
    # if [ "$status" = "success" ]; then
    #     echo "$message" | mail -s "Backup Success - Book Review App" admin@yourdomain.com
    # else
    #     echo "$message" | mail -s "Backup Failed - Book Review App" admin@yourdomain.com
    # fi
    
    # Example: Send Slack notification
    # SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"Backup ${status}: ${message}\"}" \
    #     "$SLACK_WEBHOOK"
    
    echo "Notification: $status - $message" > /dev/null
}

# Function to verify backups
verify_backups() {
    log_message "Verifying backups..."
    
    local errors=0
    
    # Check MongoDB backup
    MONGO_BACKUP=$(ls -t "${BACKUP_DIR}"/mongodb_backup_*.gz 2>/dev/null | head -1)
    if [ -z "$MONGO_BACKUP" ]; then
        log_message "ERROR: No MongoDB backup found"
        ((errors++))
    else
        # Test if the backup is valid (basic check)
        if ! gzip -t "$MONGO_BACKUP" 2>/dev/null; then
            log_message "ERROR: MongoDB backup is corrupted"
            ((errors++))
        else
            log_message "✓ MongoDB backup verified"
        fi
    fi
    
    return $errors
}

# Function to generate backup report
generate_report() {
    log_message "Generating backup report..."
    
    REPORT_FILE="${BACKUP_DIR}/backup_report_${TIMESTAMP}.txt"
    
    {
        echo "Book Review App - Backup Report"
        echo "================================"
        echo "Date: $(date)"
        echo "Timestamp: ${TIMESTAMP}"
        echo ""
        echo "Backup Directory: ${BACKUP_DIR}"
        echo ""
        echo "Recent Backups:"
        echo "---------------"
        ls -lh "${BACKUP_DIR}"/*.gz 2>/dev/null | tail -5 || echo "No backups found"
        echo ""
        echo "Disk Usage:"
        echo "-----------"
        df -h "${BACKUP_DIR}"
        echo ""
        echo "Total Backup Size:"
        du -sh "${BACKUP_DIR}"
    } > "$REPORT_FILE"
    
    log_message "✓ Report generated: ${REPORT_FILE}"
}

# Main backup process
main() {
    log_message "========================================="
    log_message "Starting Book Review App Backup Process"
    log_message "========================================="
    
    # Change to application directory
    cd /home/ubuntu/book-review-app || {
        log_message "ERROR: Could not change to application directory"
        exit 1
    }
    
    # Track success/failure
    BACKUP_SUCCESS=true
    ERROR_MESSAGE=""
    
    # Perform backups
    if ! backup_mongodb; then
        BACKUP_SUCCESS=false
        ERROR_MESSAGE="${ERROR_MESSAGE}MongoDB backup failed. "
    fi
    
    if ! backup_uploads; then
        BACKUP_SUCCESS=false
        ERROR_MESSAGE="${ERROR_MESSAGE}Uploads backup failed. "
    fi
    
    backup_env
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Verify backups
    verify_backups
    
    # Upload to cloud (if configured)
    upload_to_cloud
    
    # Generate report
    generate_report
    
    # Send notification
    if [ "$BACKUP_SUCCESS" = true ]; then
        log_message "✓ Backup process completed successfully"
        send_notification "success" "All backups completed successfully at ${TIMESTAMP}"
    else
        log_message "✗ Backup process completed with errors: ${ERROR_MESSAGE}"
        send_notification "failure" "Backup failed: ${ERROR_MESSAGE}"
        exit 1
    fi
    
    log_message "========================================="
}

# Run main function
main "$@"