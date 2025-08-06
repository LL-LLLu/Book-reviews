# Docker Commands Guide - IMPORTANT!

## ⚠️ PREVENTING DATA LOSS

### Safe Commands (Preserves Data):
```bash
# Stop containers WITHOUT removing data
docker-compose down

# Restart containers
docker-compose restart

# Start containers
docker-compose up -d

# Rebuild and restart (keeps data)
docker-compose up -d --build
```

### Dangerous Commands (DELETES ALL DATA):
```bash
# ❌ DO NOT USE unless you want to delete everything
docker-compose down -v  # The -v flag removes volumes (MongoDB data)
```

## 📊 Check Your Data

### See if MongoDB volume exists:
```bash
docker volume ls | grep mongodb_data
```

### Backup MongoDB data:
```bash
# Create backup
docker exec book-review-db mongodump --out /backup
docker cp book-review-db:/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Restore MongoDB data:
```bash
docker cp ./mongodb-backup-20240101 book-review-db:/restore
docker exec book-review-db mongorestore /restore
```

## 🔧 Common Operations

### View logs:
```bash
docker-compose logs -f
```

### Update code and restart:
```bash
git pull
docker-compose up -d --build
```

### Stop everything (keeps data):
```bash
docker-compose stop
```

### Check container status:
```bash
docker ps
```

## 💾 Data Persistence

Your data is stored in Docker volumes:
- MongoDB data: `mongodb_data` volume
- Uploaded avatars: `./backend/uploads` directory

As long as you don't use `-v` flag with `docker-compose down`, your data will persist!