# Book Review App Deployment Guide

This guide will help you deploy your Book Review App to production.

## 🚀 Deployment Architecture

- **Frontend**: Vercel (Next.js hosting)
- **Backend**: Render (Express.js hosting)
- **Database**: MongoDB Atlas (Cloud MongoDB)

## 📋 Step 1: MongoDB Atlas Setup

1. **Create Account**
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose "Shared" (free tier)
   - Select your preferred region (closest to you)
   - Create cluster

3. **Configure Access**
   - Go to "Database Access"
   - Add a new user with username/password
   - Save these credentials securely

4. **Configure Network**
   - Go to "Network Access"
   - Add IP Address: `0.0.0.0/0` (allows access from anywhere)
   - Confirm

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

## 📋 Step 2: Deploy Backend to Render

1. **Prepare Backend**
   - Push your code to GitHub
   - Make sure `.env` is in `.gitignore`

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create Web Service**
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repo
   - Select the backend directory

4. **Configure Service**
   ```
   Name: book-review-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

5. **Add Environment Variables**
   - Click "Environment"
   - Add these variables:
   ```
   MONGODB_URI = your_mongodb_connection_string
   JWT_SECRET = your_secure_secret_key
   NODE_ENV = production
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (takes 5-10 minutes)
   - Copy your backend URL (e.g., `https://book-review-backend.onrender.com`)

## 📋 Step 3: Deploy Frontend to Vercel

1. **Prepare Frontend**
   - Update `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
   ```

2. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

3. **Deploy to Vercel**
   
   **Option A: Via CLI**
   ```bash
   cd frontend
   vercel
   ```
   
   **Option B: Via GitHub**
   - Push code to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the frontend directory

4. **Configure Environment**
   - Add environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-url.onrender.com/api
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live!

## 🔧 Post-Deployment Setup

1. **Update CORS in Backend**
   - Add your Vercel URL to CORS origins in `server.js`:
   ```javascript
   app.use(cors({
     origin: ['http://localhost:3000', 'https://your-app.vercel.app'],
     credentials: true
   }));
   ```

2. **Create Admin User**
   - Use the `/api/auth/register` endpoint
   - Run the `makeAdmin.js` script with your production MongoDB URI

3. **Test Everything**
   - Register/Login
   - Add books
   - Write reviews
   - Admin functions

## 🚨 Troubleshooting

**Backend not connecting to MongoDB:**
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Check username/password

**Frontend can't reach backend:**
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS configuration
- Ensure backend is running

**Images not loading:**
- Google Books images should work
- Check Next.js image domains configuration

## 💡 Tips

- Use strong JWT_SECRET in production
- Enable MongoDB Atlas monitoring
- Set up error tracking (Sentry)
- Use environment-specific configs
- Regular backups of MongoDB

## 🔒 Security Checklist

- [ ] Strong JWT secret
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] Environment variables secured
- [ ] MongoDB user has minimal permissions
- [ ] Rate limiting enabled
- [ ] Input validation active

## 📊 Monitoring

- **Render**: Built-in metrics dashboard
- **Vercel**: Analytics and performance monitoring
- **MongoDB Atlas**: Database performance metrics

Your app should now be live and accessible to users worldwide! 🎉