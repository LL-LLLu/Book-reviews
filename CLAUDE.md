# Claude Code Context - Book Review App

## Project Overview
This is a full-stack book review application with:
- **Frontend**: Next.js, TypeScript, Tailwind CSS (Black & White UI design)
- **Backend**: Express.js, MongoDB, JWT authentication
- **Deployment**: Docker, AWS EC2
- **Features**: Google OAuth, Book search, Reviews, Admin panel, Avatar uploads

## Key Issues Resolved

### 1. UI Design Implementation
- Applied consistent black and white design system across all components
- Removed all emojis and gradient buttons
- Implemented dark mode support

### 2. Google OAuth Password Setup
- Added password setup requirement for Google OAuth users
- Created PasswordSetupModal component
- Modified User model with passwordSetup field

### 3. TypeScript & Build Errors
- Fixed Framer Motion animation ease array issues
- Resolved NextAuth type definitions
- Fixed FormData iteration for ES5 compatibility

### 4. AWS Deployment Issues
- **NextAuth Secret Error**: Added NEXTAUTH_SECRET to docker-compose.yml
- **500 Errors**: Fixed localhost URLs to use EC2 public IP
- **MongoDB Connection**: Fixed ECONNREFUSED by proper container startup order
- **Book Description Length**: Increased limit from 2000 to 5000 chars

### 5. Avatar Upload Issues
- Fixed "url parameter is invalid" error
- Added NEXT_PUBLIC_BASE_URL environment variable
- Fixed Content-Type header for multipart/form-data
- Created fallback logic in image-utils.ts

### 6. Data Persistence
- **IMPORTANT**: Never use `docker-compose down -v` (deletes all data)
- MongoDB data stored in `./mongodb_data` directory (bind mount)
- Avatars stored in `./backend/uploads` directory (bind mount)
- Use `./setup.sh` to create directories with proper permissions

## Current Configuration

### Environment Variables (.env)
```
MONGO_PASSWORD=Aa2291718824
JWT_SECRET=Aa2291718824
NEXTAUTH_SECRET=Aa2291718824
FRONTEND_URL=http://35.173.211.34:3000
NEXTAUTH_URL=http://35.173.211.34:3000
NEXT_PUBLIC_API_URL=http://35.173.211.34:5001/api
NEXT_PUBLIC_BASE_URL=http://35.173.211.34:5001
```

### AWS EC2 Details
- Public IP: 35.173.211.34
- Instance: t2.micro (free tier)
- Security Groups: Ports 22, 80, 443, 3000, 5001
- Region: Varies by user selection

## Common Commands

### Local Development
```bash
cd frontend && npm run dev
cd backend && npm run dev
```

### Docker (Safe - Preserves Data)
```bash
./setup.sh                       # Setup persistent directories (run first time)
docker-compose up -d --build     # Start/rebuild
docker-compose restart           # Restart
docker-compose logs -f           # View logs
docker-compose down              # Stop (keeps data)
```

### Admin User Creation
```bash
# Register first, then promote
docker exec book-review-db mongosh bookreview --eval "db.users.updateOne({email: 'admin@example.com'}, {\$set: {role: 'admin'}})"
```

### AWS Deployment
```bash
cd ~/book-reviews
git pull
./setup.sh                      # Setup persistent directories
docker-compose up -d --build
```

## Data Persistence Fixes Applied

### Issue 1: Avatar uploads not persisting
- **Root cause**: Container permissions and volume mounting
- **Fix**: Added bind mount `./backend/uploads:/app/uploads:rw`
- **Setup**: Run `./setup.sh` to create directories with proper permissions
- **Debug**: Added extensive logging to backend multer configuration

### Issue 2: Database data not persisting after restart
- **Root cause**: Using named volume instead of bind mount
- **Fix**: Changed to bind mount `./mongodb_data:/data/db`
- **Setup**: Run `./setup.sh` to create MongoDB directory

### Issue 3: Avatar upload "No file uploaded" error
- **Root cause**: Multer not receiving file due to permissions/middleware issues
- **Fix**: Enhanced error handling and debugging in avatar upload route
- **Debug**: Check backend logs for multer middleware errors

### Important Commands
```bash
./setup.sh                       # One-time setup for persistence
docker-compose up -d --build     # Start with data persistence
docker-compose down              # Stop but keep data
```

⚠️ **Never use `docker-compose down -v`** - it deletes all data!

## Known Issues (Resolved)
1. SSH timeout to AWS - Check security groups for current IP
2. ~~Avatar uploads may fail~~ - **FIXED** with proper volume mounting
3. ~~Data loss if using `docker-compose down -v`~~ - **FIXED** with bind mounts

## Test Pages
- `/test-avatar` - Debug avatar uploads
- `/login-simple` - Test auth without NextAuth

## GitHub Repository
https://github.com/LL-LLLu/Book-reviews.git

## Next Steps
- Set up domain and SSL certificate
- Configure AWS backups
- Implement additional features as needed