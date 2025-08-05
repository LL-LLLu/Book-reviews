# 🚀 AWS Deployment Guide - Book Review App

This guide will walk you through deploying your Book Review App on AWS EC2 with Docker.

## 📋 Prerequisites

- AWS Account (free tier eligible)
- Your domain name (optional, but recommended)
- Credit card for AWS (won't be charged if using free tier)

## 🎯 Overview

We'll deploy on a single EC2 instance running:
- Frontend (Next.js) on port 3000
- Backend (Express) on port 5001  
- MongoDB in a Docker container

**Estimated Cost**: ~$0-10/month (free tier eligible)

---

## 📺 Step 1: Launch EC2 Instance

### 1.1 Login to AWS Console
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Sign in to the Console
3. Select your region (top-right corner) - choose one close to your users

### 1.2 Launch Instance
1. Navigate to **EC2** service
2. Click **"Launch Instance"**
3. Configure as follows:

**Name**: `book-review-app`

**Amazon Machine Image (AMI)**: 
- Select **Ubuntu Server 22.04 LTS (Free tier eligible)**

**Instance Type**:
- Select **t2.micro** (Free tier eligible)
- 1 vCPU, 1 GB RAM

**Key Pair**:
- Click **"Create new key pair"**
- Name: `book-review-key`
- Type: RSA
- Format: .pem (for Mac/Linux) or .ppk (for Windows/PuTTY)
- **⚠️ Download and save this file safely!**

**Network Settings**:
- Click **"Edit"**
- Auto-assign public IP: **Enable**
- Create security group: **book-review-sg**
- Add these rules:

| Type | Protocol | Port Range | Source |
|------|----------|------------|---------|
| SSH | TCP | 22 | My IP |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 |
| Custom TCP | TCP | 5001 | 0.0.0.0/0 |

**Storage**:
- 20 GB gp3 (Free tier includes 30GB)

Click **"Launch Instance"**

---

## 🔧 Step 2: Connect to Your Instance

### 2.1 Wait for Instance
1. Go to EC2 → Instances
2. Wait for Instance State: **Running**
3. Copy the **Public IP address**

### 2.2 Connect via SSH

**Mac/Linux:**
```bash
# Set permissions on key file
chmod 400 ~/Downloads/book-review-key.pem

# Connect
ssh -i ~/Downloads/book-review-key.pem ubuntu@YOUR_PUBLIC_IP
```

**Windows (using PuTTY):**
1. Convert .pem to .ppk using PuTTYgen
2. Use PuTTY to connect with the .ppk file

---

## 🐳 Step 3: Install Docker

Once connected to your EC2 instance, run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## 📦 Step 4: Deploy Your App

### 4.1 Clone Your Repository
```bash
# Install git
sudo apt install git -y

# Clone your repo
git clone https://github.com/YOUR_USERNAME/book-review-app.git
cd book-review-app
```

### 4.2 Configure Environment
```bash
# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

Update these values:
```bash
# Generate secure passwords
JWT_SECRET=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 32)
MONGO_PASSWORD=$(openssl rand -hex 16)

# Update URLs with your EC2 public IP or domain
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP:3000
NEXTAUTH_URL=http://YOUR_EC2_PUBLIC_IP:3000
NEXT_PUBLIC_API_URL=http://YOUR_EC2_PUBLIC_IP:5001/api

# Add your Google OAuth credentials (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### 4.3 Start Application
```bash
# Build and start containers
docker-compose up -d

# Check if running
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 🌐 Step 5: Access Your App

Your app should now be accessible at:
- Frontend: `http://YOUR_EC2_PUBLIC_IP:3000`
- Backend API: `http://YOUR_EC2_PUBLIC_IP:5001`

---

## 🔒 Step 6: Set Up Domain & SSL (Optional but Recommended)

### 6.1 Point Domain to EC2
1. In your domain registrar (GoDaddy, Namecheap, etc.)
2. Create an A record:
   - Type: A
   - Host: @ (or www)
   - Value: YOUR_EC2_PUBLIC_IP
   - TTL: 3600

### 6.2 Install Nginx & Certbot
```bash
# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 6.3 Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/book-review
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/book-review /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6.4 Get SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 🔧 Step 7: Maintenance & Updates

### Update Application
```bash
cd ~/book-review-app
git pull origin main
docker-compose down
docker-compose up -d --build
```

### View Logs
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
```

### Backup Database
```bash
# Create backup
docker-compose exec mongodb mongodump --out /backup
docker cp book-review-db:/backup ./backup-$(date +%Y%m%d)

# Restore backup
docker cp ./backup-20240101 book-review-db:/restore
docker-compose exec mongodb mongorestore /restore
```

### Monitor Resources
```bash
# Check disk space
df -h

# Check memory
free -m

# Check Docker
docker system df
```

---

## 💰 Cost Optimization Tips

1. **Use Free Tier**: t2.micro is free for 12 months
2. **Stop When Not Using**: Stop instance to avoid charges
3. **Use Elastic IP**: Prevents IP change when stopping
4. **Set Up Billing Alerts**: Get notified before charges

---

## 🚨 Troubleshooting

### Can't Access Site
1. Check Security Group rules
2. Verify Docker containers are running: `docker-compose ps`
3. Check logs: `docker-compose logs`

### MongoDB Connection Issues
```bash
# Check MongoDB container
docker logs book-review-db

# Restart containers
docker-compose restart
```

### Out of Disk Space
```bash
# Clean Docker
docker system prune -a

# Check large files
du -h --max-depth=1 /
```

---

## 🎉 Success!

Your Book Review App is now live on AWS! 

**Next Steps:**
1. Set up regular backups
2. Configure monitoring (AWS CloudWatch)
3. Set up auto-restart on reboot
4. Consider using AWS RDS for managed MongoDB

**Auto-start on Reboot:**
```bash
# Create systemd service
sudo nano /etc/systemd/system/book-review.service
```

Add:
```ini
[Unit]
Description=Book Review App
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/book-review-app
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable book-review.service
```

Your app will now automatically start when the EC2 instance boots!