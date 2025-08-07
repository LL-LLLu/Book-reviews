# Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment & Secrets
- [ ] Generate strong, unique passwords (minimum 32 characters)
  ```bash
  openssl rand -base64 32  # For MONGO_PASSWORD
  openssl rand -base64 64  # For JWT_SECRET
  openssl rand -base64 64  # For NEXTAUTH_SECRET
  ```
- [ ] Create `.env` file with production values
- [ ] Never commit `.env` to git (verify `.gitignore`)
- [ ] Update Google OAuth credentials with production URLs

### 2. Domain & DNS
- [ ] Purchase/configure domain name
- [ ] Set up DNS A records pointing to server IP
- [ ] Configure subdomain if needed (e.g., api.yourdomain.com)
- [ ] Wait for DNS propagation (can take up to 48 hours)

### 3. Server Setup
- [ ] Choose hosting provider (AWS EC2, Digital Ocean, etc.)
- [ ] Create server instance (minimum 2GB RAM recommended)
- [ ] Configure firewall/security groups:
  - Port 22 (SSH) - Your IP only
  - Port 80 (HTTP) - All
  - Port 443 (HTTPS) - All
- [ ] Set up SSH key authentication
- [ ] Disable password authentication for SSH

### 4. Server Configuration
- [ ] Update system packages
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
- [ ] Install Docker and Docker Compose
- [ ] Install Nginx
- [ ] Install Certbot for SSL
- [ ] Configure automatic security updates

## Deployment Steps

### 1. Initial Deployment
- [ ] Clone repository to server
- [ ] Create production `.env` file
- [ ] Run setup script
  ```bash
  chmod +x setup.sh
  ./setup.sh
  ```
- [ ] Run deployment script
  ```bash
  chmod +x scripts/deploy.sh
  ./scripts/deploy.sh
  ```

### 2. Web Server Configuration
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificate with Let's Encrypt
- [ ] Test SSL configuration (https://www.ssllabs.com/ssltest/)
- [ ] Enable HTTP to HTTPS redirect

### 3. Application Configuration
- [ ] Verify all containers are running
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```
- [ ] Test health endpoint
  ```bash
  curl http://localhost:5001/api/health
  ```
- [ ] Create admin user
- [ ] Test Google OAuth login
- [ ] Test file uploads (avatar)

### 4. Monitoring & Backups
- [ ] Set up automated backups
  ```bash
  crontab -e
  # Add: 0 2 * * * /home/ubuntu/book-review-app/scripts/backup.sh
  ```
- [ ] Set up monitoring
  ```bash
  crontab -e
  # Add: */5 * * * * /home/ubuntu/book-review-app/scripts/monitor.sh
  ```
- [ ] Configure log rotation
- [ ] Set up uptime monitoring (UptimeRobot, etc.)

## Post-Deployment Checklist

### 1. Security Verification
- [ ] Verify HTTPS is working
- [ ] Check for exposed ports (only 80, 443 should be public)
- [ ] Verify environment variables are not exposed
- [ ] Test rate limiting is working
- [ ] Verify MongoDB is not publicly accessible

### 2. Performance Testing
- [ ] Test page load times
- [ ] Check mobile responsiveness
- [ ] Verify images are loading correctly
- [ ] Test under load (use tools like Apache Bench)

### 3. Functionality Testing
- [ ] User registration
- [ ] User login (email/password)
- [ ] Google OAuth login
- [ ] Password reset
- [ ] Book search and add
- [ ] Review creation and editing
- [ ] Avatar upload
- [ ] Admin functions

### 4. Documentation
- [ ] Document server access procedures
- [ ] Document backup restoration process
- [ ] Document deployment process
- [ ] Share credentials securely with team

## Maintenance Tasks

### Daily
- [ ] Check monitoring alerts
- [ ] Review error logs
- [ ] Verify backups completed

### Weekly
- [ ] Review server resources (disk, memory, CPU)
- [ ] Check for security updates
- [ ] Review user activity

### Monthly
- [ ] Test backup restoration
- [ ] Review and rotate logs
- [ ] Update dependencies
- [ ] Security audit

## Emergency Procedures

### If Site is Down
1. Check server status
   ```bash
   ssh ubuntu@your-server-ip
   docker-compose -f docker-compose.prod.yml ps
   ```
2. Check logs
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail=100
   ```
3. Restart services
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```
4. If still down, check Nginx
   ```bash
   sudo systemctl status nginx
   sudo systemctl restart nginx
   ```

### If Database is Corrupted
1. Stop services
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```
2. Restore from backup
   ```bash
   docker run --rm -v $(pwd)/mongodb_data:/data/db \
     -v $(pwd)/backups:/backup mongo:7.0 \
     mongorestore --archive=/backup/mongodb_backup_latest.gz --gzip
   ```
3. Start services
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### If Hacked/Compromised
1. Take site offline immediately
2. Preserve evidence (logs, files)
3. Change all passwords and secrets
4. Restore from known good backup
5. Audit security measures
6. Implement additional security

## Important Commands

### Docker Commands
```bash
# View running containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Rebuild and start
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Commands
```bash
# Access MongoDB shell
docker exec -it book-review-db mongosh

# Create admin user
docker exec book-review-db mongosh bookreview --eval "db.users.updateOne({email: 'admin@example.com'}, {\$set: {role: 'admin'}})"

# Export database
docker exec book-review-db mongodump --archive=/tmp/backup.gz --gzip

# Import database
docker exec book-review-db mongorestore --archive=/tmp/backup.gz --gzip
```

### Monitoring Commands
```bash
# Check disk usage
df -h

# Check memory usage
free -m

# Check container stats
docker stats

# Check service health
curl http://localhost:5001/api/health
```

## Support Contacts

- **Server Provider Support**: [Your provider's support]
- **Domain Registrar**: [Your registrar's support]
- **Team Contacts**: [Your team contacts]
- **Emergency Contact**: [24/7 contact if available]

## Notes

- Always test changes in development first
- Keep backups before major updates
- Document any custom configurations
- Regular security updates are critical
- Monitor costs to avoid surprises