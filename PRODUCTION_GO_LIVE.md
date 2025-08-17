# Book Review App — Production Go-Live (AWS + HTTPS)

This guide takes you from a working repo to a public, HTTPS-ready site on AWS EC2 using Docker, Nginx, and Let’s Encrypt. It is tailored to this repository’s compose files and ports.

If you want the deep-dive version, see: PRODUCTION_DEPLOYMENT.md and PRODUCTION_CHECKLIST.md.

## Prerequisites
- AWS account with an EC2 instance (Ubuntu 22.04 recommended)
- Domain name (recommended) and ability to edit its DNS
- SSH access to the instance
- Google OAuth credentials for your production domain (if using Google login)

## Architecture Overview
- Frontend (Next.js): container exposes `3000` (bound to `127.0.0.1:3000` in prod compose)
- Backend (Express): container exposes `5001` (bound to `127.0.0.1:5001` in prod compose)
- MongoDB: internal-only container; data persisted via `./mongodb_data`
- Nginx: reverse proxy on ports `80` and `443`, routes `/` to frontend and `/api` + `/uploads` to backend

## 1) EC2 + Security Groups + Elastic IP
1. Launch an EC2 instance (Ubuntu 22.04, t2.small recommended; t2.micro works for very light traffic).
2. Security Group rules (ingress):
   - SSH `22/tcp`: Your IP only
   - HTTP `80/tcp`: 0.0.0.0/0
   - HTTPS `443/tcp`: 0.0.0.0/0
3. Allocate and associate an Elastic IP to keep a stable IP for DNS.

## 2) Base Server Setup
SSH into the instance and install dependencies:

```bash
sudo apt update && sudo apt upgrade -y

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git, Nginx, Certbot
sudo apt install -y git nginx certbot python3-certbot-nginx

# Re-login for docker group to take effect
exit
```

Reconnect via SSH.

## 3) Clone Repo and Prepare Environment
```bash
git clone https://github.com/LL-LLLu/Book-reviews.git book-review-app
cd book-review-app
```

Create `.env.production` (you can use the existing `.env.production` here as a base):

```env
# Database
MONGO_PASSWORD=<strong-unique-password>
MONGODB_URI=mongodb://admin:<strong-unique-password>@mongodb:27017/bookreview?authSource=admin

# Secrets
JWT_SECRET=<64-char-random>
NEXTAUTH_SECRET=<64-char-random>

# Google OAuth (update in Google Console)
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Production URLs (replace with your domain)
FRONTEND_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

Generate secrets:

```bash
openssl rand -base64 64  # JWT_SECRET
openssl rand -base64 64  # NEXTAUTH_SECRET
openssl rand -base64 32  # MONGO_PASSWORD
```

## 4) Persistent Data Directories
Run the repo’s setup script to create bind-mount directories with correct permissions:

```bash
chmod +x ./setup.sh
./setup.sh
```

## 5) Allow Images From Your Domain (Next.js)
If serving avatars via your domain, add your domain to `frontend/next.config.js` `images.remotePatterns` so Next.js can load them via HTTPS. Example entry to add:

```js
{
  protocol: 'https',
  hostname: 'yourdomain.com',
}
```

Rebuild after editing.

## 6) Start App With Production Compose
Use the production compose file which binds services to localhost only (safer behind Nginx):

```bash
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml ps
```

Health checks should pass for backend and frontend. You can also verify locally on the server:

```bash
curl -f http://127.0.0.1:5001/api/health
curl -I http://127.0.0.1:3000
```

## 7) Nginx Reverse Proxy (HTTP)
Create an Nginx site config that routes traffic to the containers:

```bash
sudo nano /etc/nginx/sites-available/bookreview
```

Paste (replace `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect www to apex (optional)
    if ($host = www.yourdomain.com) { return 301 https://yourdomain.com$request_uri; }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API (preserve /api path)
    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Avatar uploads
    location /uploads/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/bookreview /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 8) DNS → Your EC2 IP
In your domain registrar, create DNS records pointing to the instance’s Elastic IP:

```
A  @    -> ELASTIC_IP
A  www  -> ELASTIC_IP
```

Wait for DNS to propagate (often minutes, up to 24–48h).

## 9) HTTPS With Let’s Encrypt
Issue certificates and enable HTTPS via Certbot’s Nginx integration:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot renew --dry-run
```

Certbot updates Nginx to listen on 443 with SSL and installs auto-renew.

## 10) Google OAuth + NextAuth URLs
In Google Cloud Console, update authorized URIs for your domain:
- Authorized JavaScript origins: `https://yourdomain.com`
- Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

Ensure these envs match your domain and use HTTPS:
- `FRONTEND_URL=https://yourdomain.com`
- `NEXTAUTH_URL=https://yourdomain.com`
- `NEXT_PUBLIC_API_URL=https://yourdomain.com/api`
- `NEXT_PUBLIC_BASE_URL=https://yourdomain.com`

Rebuild if you change build-time vars for the frontend:

```bash
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

## 11) Smoke Tests
- Open `https://yourdomain.com` and confirm no mixed-content warnings
- Email/password login works
- Google login works (if configured)
- Avatar upload works across pages (Settings, Profile, lists)
- Admin promotion (via Mongo shell) if needed:

```bash
docker exec book-review-db mongosh bookreview --eval "db.users.updateOne({email: 'admin@example.com'}, {\$set: {role: 'admin'}})"
```

## 12) Security Hardening
- SSH: key-based only, disable password auth (`/etc/ssh/sshd_config` → `PasswordAuthentication no`, `PermitRootLogin no`)
- Firewall: UFW allow `OpenSSH` and `Nginx Full`; enable UFW
  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 'Nginx Full'
  sudo ufw enable
  ```
- Keep services private: Production compose already binds app ports to `127.0.0.1` only
- Secrets: store `.env.production` securely; do not commit to git

## 13) Backups & Monitoring
- Backups: database dump + uploads tarball (see PRODUCTION_DEPLOYMENT.md for sample `backup.sh`)
- Monitoring: uptime checks + a simple container watchdog (sample in PRODUCTION_DEPLOYMENT.md)
- Logs: `docker-compose -f docker-compose.prod.yml logs -f` and Nginx logs in `/var/log/nginx/`

## 14) Updates & Maintenance
```bash
git pull
docker-compose -f docker-compose.prod.yml up -d --build
sudo systemctl restart nginx  # if Nginx config changed
```

Optional: create a systemd unit to auto-start on reboot (see AWS-DEPLOYMENT.md).

## Common Pitfalls
- Mixed content: ensure all URLs/envs use `https://yourdomain.com`
- Next.js images: add your domain to `images.remotePatterns`
- OAuth mismatch: update Google Cloud Console and `NEXTAUTH_URL`
- Data loss: never run `docker-compose down -v` in production

You’re production-ready. For extended guidance, consult PRODUCTION_DEPLOYMENT.md and AWS-DEPLOYMENT.md.

