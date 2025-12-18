# 🚀 AWS Quick Start - Your First Cloud Deployment!

Welcome! This guide will help you deploy your Book Review App to AWS in about 30 minutes.

## 📝 What You'll Need

1. **AWS Account** - Don't have one? [Sign up here](https://aws.amazon.com) (free)
2. **Credit Card** - Required by AWS, but we'll use free tier (no charges)
3. **Your GitHub Repository** - Where your code is stored

## 🎯 What We're Building

Your app will run on a single AWS EC2 server (think of it as a computer in the cloud) with:
- Your frontend (Next.js) 
- Your backend (Express)
- Your database (MongoDB)

All packaged nicely with Docker!

---

# Step 1: Create Your AWS Account (5 minutes)

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Fill in your details:
   - Email address
   - Password  
   - Account name (e.g., "My Personal Account")
4. Add payment information (you won't be charged if you stay in free tier)
5. Verify your phone number
6. Choose "Basic Support - Free"

✅ **Done?** Great! You now have AWS access.


---

# Step 2: Launch Your First Server (10 minutes)

## 2.1 Sign In to AWS Console

1. Go to [console.aws.amazon.com](https://console.aws.amazon.com)
2. Sign in with your new account
3. In the top-right corner, select a region close to you:
   - US East (N. Virginia) - if you're in Eastern US
   - US West (Oregon) - if you're in Western US
   - Europe (Ireland) - if you're in Europe
   - Asia Pacific (Singapore) - if you're in Asia

## 2.2 Find EC2 Service

1. In the search bar at the top, type "EC2"
2. Click on "EC2" from the results
3. You'll see the EC2 Dashboard

## 2.3 Launch Your Server

1. Click the orange **"Launch Instance"** button

2. **Name your server:**
   - Name: `book-review-app`

3. **Choose your operating system:**
   - Scroll to "Ubuntu"
   - Select **"Ubuntu Server 22.04 LTS (HVM), SSD Volume Type"**
   - Make sure it says "Free tier eligible"

4. **Choose server size:**
   - Instance type: **t2.micro** (Free tier eligible)
   - This gives you 1 CPU and 1GB RAM - perfect for starting!

5. **Create a key pair (VERY IMPORTANT!):**
   - Click **"Create new key pair"**
   - Key pair name: `book-review-key`
   - Key pair type: RSA
   - Private key format: 
     - **.pem** if you use Mac or Linux
     - **.ppk** if you use Windows
   - Click **"Create key pair"**
   - ⚠️ **IMPORTANT**: Your key file will download. Save it somewhere safe! You need this to access your server.

6. **Network settings:**
   - Click **"Edit"** (on the right side)
   - Auto-assign public IP: **Enable**
   - Firewall (security groups): Select **"Create security group"**
   - Security group name: `book-review-sg`
   - Description: `Security group for book review app`

7. **Add firewall rules:**
   Click **"Add security group rule"** for each of these:

   | Type | Port | Source | Description |
   |------|------|--------|-------------|
   | SSH | 22 | My IP | SSH access |
   | HTTP | 80 | Anywhere | Web traffic |
   | HTTPS | 443 | Anywhere | Secure web traffic |
   | Custom TCP | 3000 | Anywhere | Frontend |
   | Custom TCP | 5001 | Anywhere | Backend API |

   (Click "Add security group rule" 4 times to add the last 4 rules)

8. **Storage:**
   - Leave the default (8 GB)
   - Free tier includes up to 30GB

9. **Launch!**
   - Review everything
   - Click **"Launch Instance"**

10. **Success!**
    - Click **"View all instances"**
    - You'll see your instance starting up
    - Wait for "Instance state" to show **"Running"** (takes 1-2 minutes)

---

# Step 3: Connect to Your Server (5 minutes)
============================================================================================
## 3.1 Find Your Server's Address

1. In the EC2 instances page, click on your instance
2. Find and copy the **"Public IPv4 address"** (looks like: 54.123.45.67)
3. Save this address - you'll need it!

35.173.211.34

## 3.2 Connect to Your Server

### For Mac/Linux Users:

1. Open Terminal
2. Navigate to where you saved your key file:
   ```bash
   cd ~/Downloads
   ```

3. Secure your key file:
   ```bash
   chmod 400 book-review-key.pem
   ```

4. Connect to your server:
   ```bash
   ssh -i book-review-key.pem ubuntu@YOUR_PUBLIC_IP
   ```
   (Replace YOUR_PUBLIC_IP with the address you copied)

5. Type "yes" when asked about authenticity

### For Windows Users:

1. Download [PuTTY](https://www.putty.org/)
2. Use PuTTYgen to convert your .ppk file
3. Use PuTTY to connect:
   - Host Name: ubuntu@YOUR_PUBLIC_IP
   - Port: 22
   - Connection > SSH > Auth > Private key file: browse to your .ppk file
   - Click "Open"

## 3.3 You're In!

You should see something like:
```
Welcome to Ubuntu 22.04.3 LTS
ubuntu@ip-172-31-23-456:~$
```

Congratulations! You're now connected to your cloud server! 🎉

---

# Step 4: Set Up Your Server (10 minutes)

Now let's install everything your app needs. Copy and paste these commands one by one:

## 4.1 Update the System
```bash
sudo apt update && sudo apt upgrade -y
```
(This updates all software packages - press Enter if asked)

## 4.2 Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
```

## 4.3 Apply Docker Permissions
```bash
exit
```
(This logs you out)

Now reconnect using the same SSH command as before:
```bash
ssh -i book-review-key.pem ubuntu@YOUR_PUBLIC_IP
```

## 4.4 Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 4.5 Install Git
```bash
sudo apt install git -y
```

## 4.6 Verify Everything Works
```bash
docker --version
docker-compose --version
git --version
```

You should see version numbers for each tool.

---

# Step 5: Deploy Your App! (5 minutes)

## 5.1 Clone Your Code
```bash
git clone https://github.com/LL-LLLu/book-reviews.git
cd book-reviews
```
(Replace YOUR_USERNAME with your GitHub username)

## 5.2 Create Environment File
```bash
cp .env.example .env
nano .env
```

## 5.3 Update Your Settings

In the nano editor, update these values:

1. Find the URLs and replace `localhost` with your server's IP:
   ```
   FRONTEND_URL=http://YOUR_PUBLIC_IP:3000
   NEXTAUTH_URL=http://35.173.211.34:3000
   NEXT_PUBLIC_API_URL=http://YOUR_PUBLIC_IP:5001/api
   ```

2. Generate secure passwords:
   - For JWT_SECRET: Delete the current value and type a long random string
   - For NEXTAUTH_SECRET: Delete the current value and type another long random string
   - For MONGO_PASSWORD: Delete the current value and type a secure password

3. Save the file:
   - Press `Ctrl + X`
   - Press `Y`
   - Press `Enter`

## 5.4 Start Your App!
```bash
docker-compose up -d
```

This will:
- Download all necessary images
- Build your application
- Start all services

Wait about 2-3 minutes for everything to start.

## 5.5 Check If It's Running
```bash
docker-compose ps
```

You should see all services as "Up".

---

# 🎉 Congratulations! Your App is Live!

## Access Your App

Open your web browser and go to:
- **Your App**: `http://YOUR_PUBLIC_IP:3000`
- **API**: `http://YOUR_PUBLIC_IP:5001`

(Replace YOUR_PUBLIC_IP with your server's address)

## First Steps with Your Live App

1. Create an account
2. Add some books
3. Write reviews
4. Share with friends!

---

# 📝 Important Commands

## Check logs if something's wrong:
```bash
docker-compose logs -f
```
(Press Ctrl+C to exit logs)

## Restart your app:
```bash
docker-compose restart
```

## Stop your app:
```bash
docker-compose down
```

## Update your app after code changes:
```bash
git pull
docker-compose up -d --build
```

---

# 💰 Cost Management

## Stay Free:
- t2.micro is free for 750 hours/month for 12 months
- That's 24/7 operation for a full month!
- After 12 months: ~$9/month

## Stop Server When Not Using:
1. Go to EC2 console
2. Select your instance
3. Instance State → Stop Instance
4. Start it again when needed (IP address might change)

## Monitor Usage:
- AWS Console → Billing Dashboard
- Set up billing alerts at $5

---

# 🚨 Troubleshooting

## Can't see your website?

1. Check security groups:
   - EC2 → Instances → Click your instance
   - Security tab → Click security group
   - Verify all 5 rules exist

2. Check if Docker is running:
   ```bash
   docker-compose ps
   ```

3. Check logs for errors:
   ```bash
   docker-compose logs
   ```

## Lost your key file?
- You'll need to create a new instance
- This time, save the key file safely!

## Server running slow?
- t2.micro has limited resources
- Consider upgrading to t2.small ($18/month)

---

# 🎓 What's Next?

## Make it Professional:
1. Buy a domain name ($12/year)
2. Set up HTTPS (free with Let's Encrypt)
3. Use a load balancer

## Learn More:
- [AWS Free Tier Details](https://aws.amazon.com/free/)
- [Docker Basics](https://docs.docker.com/get-started/)
- [MongoDB Backups](https://www.mongodb.com/docs/manual/core/backups/)

---

# 🙌 You Did It!

You've successfully deployed your first application to the cloud! This is a huge accomplishment. 

**Remember:**
- Your app is now accessible from anywhere in the world
- You can update it anytime with git pull
- You're using the same technology as major companies

**Need Help?**
- Check the logs first
- Google error messages
- Ask in developer communities

Welcome to the cloud! 🚀