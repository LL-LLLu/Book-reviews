# 🚀 Production Deployment - Step by Step Guide

Your secrets have been generated! Follow these steps to deploy your app to production.

## Step 1: Choose Your Hosting Provider

### Option A: AWS EC2 (Free tier available)
1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Launch EC2 Instance:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (free) or t2.small (recommended)
   - **Storage**: 20GB minimum
   - **Security Group**: 
     - SSH (22) from your IP
     - HTTP (80) from anywhere
     - HTTPS (443) from anywhere

### Option B: Digital Ocean (Simpler)
1. Go to [Digital Ocean](https://www.digitalocean.com/)
2. Create Droplet:
   - **Image**: Ubuntu 22.04
   - **Size**: Basic $6/month (1GB RAM) minimum
   - **Region**: Choose closest to your users

## Step 2: Connect to Your Server

```bash
# For AWS
ssh -i your-key.pem ubuntu@YOUR_SERVER_IP

# For Digital Ocean
ssh root@YOUR_SERVER_IP
```

## Step 3: Install Required Software

Run these commands on your server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install Certbot (for SSL)
sudo apt install certbot python3-certbot-nginx -y

# Logout and login again for docker permissions
exit
```

## Step 4: Deploy Your Application

SSH back into your server and run:

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/book-review-app.git
cd book-review-app

# Copy production env file
cp .env.production .env

# Edit .env with your actual values
nano .env
```

### Update the .env file with:

1. **Your Google OAuth credentials** (from Google Cloud Console)
2. **Your domain/IP addresses**

For initial deployment with IP address:
```env
FRONTEND_URL=http://YOUR_SERVER_IP:3000
NEXTAUTH_URL=http://YOUR_SERVER_IP:3000
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:5001/api
NEXT_PUBLIC_BASE_URL=http://YOUR_SERVER_IP:5001
```

## Step 5: Run the Deployment

```bash
# Make scripts executable
chmod +x setup.sh
chmod +x scripts/*.sh

# Set up directories
./setup.sh

# Deploy the application
./scripts/deploy.sh
```

## Step 6: Configure Nginx (For Domain Setup)

If you have a domain, create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/bookreview
```

Add this configuration (replace yourdomain.com):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5001/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /uploads {
        proxy_pass http://localhost:5001/uploads;
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

## Step 7: Set Up SSL (HTTPS)

If you have a domain configured:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 8: Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client
5. Add to Authorized redirect URIs:
   - `http://YOUR_DOMAIN_OR_IP:3000/api/auth/callback/google`
   - `https://YOUR_DOMAIN/api/auth/callback/google` (if using HTTPS)

## Step 9: Create Your First Admin User

```bash
# First, register a normal user through the web interface
# Then run this command to make them admin:
docker exec book-review-db mongosh bookreview --eval "db.users.updateOne({email: 'your-email@example.com'}, {\$set: {role: 'admin'}})"
```

## Step 10: Set Up Automated Backups

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /home/ubuntu/book-review-app/scripts/backup.sh

# Add this line for monitoring every 5 minutes
*/5 * * * * /home/ubuntu/book-review-app/scripts/monitor.sh
```

## 🎉 Your App is Now Live!

### Access your application:
- **Frontend**: http://YOUR_SERVER_IP:3000 (or https://yourdomain.com)
- **API Health Check**: http://YOUR_SERVER_IP:5001/api/health

### Useful Commands:

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Check status
docker-compose -f docker-compose.prod.yml ps

# Quick deploy updates
./scripts/quick-deploy.sh
```

## 🔒 Important Security Notes

1. **Change default MongoDB password** - We've already generated a strong one ✅
2. **Keep your .env file secure** - Never commit it to git
3. **Set up firewall** - Only expose necessary ports
4. **Regular updates** - Keep your server and Docker images updated
5. **Monitor logs** - Check for suspicious activity

## 📊 Monitoring Your Application

### Check Application Health:
```bash
curl http://localhost:5001/api/health
```

### Monitor Resources:
```bash
# Check disk space
df -h

# Check memory
free -m

# Check Docker stats
docker stats
```

## 🆘 Troubleshooting

### If containers won't start:
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart Docker
sudo systemctl restart docker

# Rebuild containers
docker-compose -f docker-compose.prod.yml up -d --build
```

### If you see "502 Bad Gateway":
- Check if containers are running
- Check Nginx configuration
- Restart Nginx: `sudo systemctl restart nginx`

### If uploads aren't working:
```bash
# Check permissions
ls -la backend/uploads/

# Fix permissions if needed
sudo chown -R 1000:1000 backend/uploads/
```

## 📈 Next Steps

1. **Set up a domain name** for professional appearance
2. **Configure email service** for password resets
3. **Set up CDN** (CloudFlare) for better performance
4. **Add monitoring** (UptimeRobot, New Relic)
5. **Implement CI/CD** with GitHub Actions

## Need Help?

- Check `PRODUCTION_DEPLOYMENT.md` for detailed information
- Review `PRODUCTION_CHECKLIST.md` for all steps
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Monitor health: `curl http://localhost:5001/api/health`

Good luck with your deployment! 🚀