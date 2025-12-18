# Production Deployment Guide for Book Review App

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [AWS EC2 Deployment](#aws-ec2-deployment)
4. [Digital Ocean Deployment](#digital-ocean-deployment)
5. [Domain & SSL Setup](#domain--ssl-setup)
6. [Security Checklist](#security-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to production, ensure you have:
- [ ] A domain name (or use a subdomain)
- [ ] Access to a cloud hosting provider (AWS, Digital Ocean, etc.)
- [ ] Google OAuth credentials configured for your production domain
- [ ] Strong, unique passwords and secrets generated

## Deployment Options

### Option 1: AWS EC2 (Recommended for scalability)
- **Pros**: Free tier available, highly scalable, extensive services
- **Cons**: More complex setup, can get expensive
- **Best for**: Growing applications, enterprise needs

### Option 2: Digital Ocean (Recommended for simplicity)
- **Pros**: Simple UI, predictable pricing, good documentation
- **Cons**: Less extensive services than AWS
- **Best for**: Small to medium projects, straightforward deployments

### Option 3: Vercel + MongoDB Atlas (Serverless)
- **Pros**: Zero-config deployment, automatic scaling, global CDN
- **Cons**: Backend needs adaptation for serverless
- **Best for**: Frontend-heavy applications

## AWS EC2 Deployment

### Step 1: Launch EC2 Instance

1. **Log into AWS Console** and go to EC2
2. **Launch Instance** with these settings:
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t2.small (minimum for production) or t2.micro (free tier)
   - Storage: 20GB minimum
   - Security Group Rules:
     - SSH (22) - Your IP only
     - HTTP (80) - Anywhere
     - HTTPS (443) - Anywhere

### Step 2: Initial Server Setup

```bash
# Connect to your server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install Certbot (for SSL)
sudo apt install certbot python3-certbot-nginx -y

# Logout and login again for docker group to take effect
exit
```

### Step 3: Clone and Configure Application

```bash
# SSH back in
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone your repository
git clone https://github.com/yourusername/book-review-app.git
cd book-review-app

# Create production .env file
nano .env
```

Add your production environment variables:

```env
# Database
MONGO_PASSWORD=use-a-very-strong-password-here-32-chars-minimum
MONGODB_URI=mongodb://admin:use-a-very-strong-password-here-32-chars-minimum@mongodb:27017/bookreview?authSource=admin

# Security
JWT_SECRET=generate-64-random-characters-here
NEXTAUTH_SECRET=generate-another-64-random-characters-here

# Google OAuth (update in Google Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# URLs (replace with your domain)
FRONTEND_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Step 4: Setup Data Persistence

```bash
# Run the setup script
chmod +x setup.sh
./setup.sh

# Verify directories were created
ls -la mongodb_data/
ls -la backend/uploads/
```

### Step 5: Configure Nginx Reverse Proxy

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/bookreview
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Avatar uploads
    location /uploads {
        proxy_pass http://localhost:5001/uploads;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/bookreview /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Start Application

```bash
# Build and start containers
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Verify containers are running
docker-compose ps
```

### Step 7: Setup SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Digital Ocean Deployment

### Step 1: Create Droplet

1. **Log into Digital Ocean**
2. **Create Droplet**:
   - Distribution: Ubuntu 22.04 LTS
   - Plan: Basic $6/month (1GB RAM minimum)
   - Datacenter: Choose closest to your users
   - Authentication: SSH keys (recommended)

### Step 2: Follow AWS Steps 2-7
The setup process is identical to AWS EC2 from Step 2 onwards.

## Domain & SSL Setup

### Domain Configuration

1. **Purchase a domain** from providers like:
   - Namecheap
   - GoDaddy
   - Google Domains
   - Cloudflare

2. **Configure DNS Records**:
   ```
   A Record: @ -> Your Server IP
   A Record: www -> Your Server IP
   ```

3. **Update Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Add your production URLs to authorized redirect URIs:
     - `https://yourdomain.com/api/auth/callback/google`
     - `https://www.yourdomain.com/api/auth/callback/google`

### SSL Certificate Setup

Use Let's Encrypt for free SSL certificates (shown in deployment steps above).

## Security Checklist

### Essential Security Measures

- [ ] **Strong Passwords**: All passwords should be 32+ characters
- [ ] **Environment Variables**: Never commit .env files to git
- [ ] **Firewall**: Configure UFW or Security Groups
- [ ] **SSH Key Only**: Disable password authentication for SSH
- [ ] **Regular Updates**: Set up automatic security updates
- [ ] **HTTPS Only**: Redirect all HTTP to HTTPS
- [ ] **Rate Limiting**: Implement API rate limiting
- [ ] **Input Validation**: Validate all user inputs
- [ ] **MongoDB Security**: Use strong passwords, enable auth
- [ ] **Backup Strategy**: Regular automated backups

### Configure Ubuntu Firewall

```bash
# Enable UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Secure SSH

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Set these values:
PasswordAuthentication no
PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

## Monitoring & Maintenance

### Setup Monitoring

1. **Application Monitoring**:
   ```bash
   # Create monitoring script
   nano monitor.sh
   ```

   ```bash
   #!/bin/bash
   # Check if containers are running
   if ! docker-compose ps | grep -q "Up"; then
       echo "Containers are down! Restarting..."
       docker-compose up -d
       # Send alert (configure email/Slack)
   fi
   ```

   ```bash
   chmod +x monitor.sh
   # Add to crontab
   crontab -e
   # Add: */5 * * * * /home/ubuntu/book-review-app/monitor.sh
   ```

2. **Setup Logging**:
   ```bash
   # View logs
   docker-compose logs -f
   
   # Save logs to file
   docker-compose logs > logs_$(date +%Y%m%d).txt
   ```

### Database Backups

Create backup script:

```bash
nano backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec book-review-db mongodump --archive=/tmp/backup_$DATE.gz --gzip
docker cp book-review-db:/tmp/backup_$DATE.gz $BACKUP_DIR/

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x backup.sh
# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/book-review-app/backup.sh
```

### Updates and Maintenance

```bash
# Update application
git pull
docker-compose down
docker-compose up -d --build

# Update server
sudo apt update && sudo apt upgrade -y

# Clean up Docker
docker system prune -a -f
```

## Production Environment Variables

### Generate Strong Secrets

```bash
# Generate random strings for secrets
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For MONGO_PASSWORD
```

### Complete .env for Production

```env
# Database
MONGO_PASSWORD=<64-character-random-string>
MONGODB_URI=mongodb://admin:<same-password>@mongodb:27017/bookreview?authSource=admin

# Security
JWT_SECRET=<64-character-random-string>
NEXTAUTH_SECRET=<64-character-random-string>

# Google OAuth
GOOGLE_CLIENT_ID=<your-production-client-id>
GOOGLE_CLIENT_SECRET=<your-production-secret>

# Production URLs
FRONTEND_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Troubleshooting

### Common Issues and Solutions

1. **502 Bad Gateway**
   - Check if containers are running: `docker-compose ps`
   - Check logs: `docker-compose logs`
   - Restart: `docker-compose restart`

2. **MongoDB Connection Issues**
   - Verify MongoDB is running: `docker ps | grep mongo`
   - Check credentials in .env match docker-compose.yml
   - Check MongoDB logs: `docker logs book-review-db`

3. **Avatar Upload Issues**
   - Check permissions: `ls -la backend/uploads/`
   - Fix permissions: `sudo chown -R 1000:1000 backend/uploads/`

4. **Google OAuth Not Working**
   - Verify redirect URIs in Google Console
   - Check NEXTAUTH_URL matches your domain
   - Ensure HTTPS is working

5. **High Memory Usage**
   - Monitor: `docker stats`
   - Restart containers: `docker-compose restart`
   - Consider upgrading server

### Debug Commands

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Enter container
docker exec -it book-review-backend sh

# Check MongoDB
docker exec -it book-review-db mongosh

# Test API
curl https://yourdomain.com/api/health

# Check disk space
df -h

# Check memory
free -m

# Check processes
htop
```

## Performance Optimization

### Frontend Optimization
- Enable Next.js production optimizations (already in Dockerfile)
- Use CDN for static assets
- Enable gzip compression in Nginx

### Backend Optimization
- Implement caching with Redis
- Use PM2 for process management
- Optimize MongoDB queries with indexes

### Nginx Optimization

Add to nginx config:

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml;

# Cache static files
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Cost Estimation

### AWS EC2
- t2.micro (free tier): $0/month for 1 year
- t2.small: ~$17/month
- t2.medium: ~$34/month
- Storage: ~$2/month for 20GB
- Bandwidth: ~$0.09/GB after 1GB free

### Digital Ocean
- Basic Droplet 1GB: $6/month
- Basic Droplet 2GB: $12/month
- Basic Droplet 4GB: $24/month
- Bandwidth: 1-4TB included

### Additional Costs
- Domain: $10-15/year
- SSL: Free with Let's Encrypt
- Email service: $0-10/month
- Backup storage: $1-5/month

## Next Steps After Deployment

1. **Set up monitoring** (Uptime Robot, New Relic, or Datadog)
2. **Configure email alerts** for system issues
3. **Implement CI/CD** with GitHub Actions
4. **Set up staging environment** for testing
5. **Document your API** with Swagger/OpenAPI
6. **Implement rate limiting** and DDoS protection
7. **Set up analytics** (Google Analytics, Plausible)
8. **Configure CDN** (Cloudflare, AWS CloudFront)

## Support Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)