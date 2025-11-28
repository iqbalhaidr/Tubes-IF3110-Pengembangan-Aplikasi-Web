# Nimonspedia M2 - Docker & Running Guide (README 2.0)

Complete guide for running the Milestone 2 containerized application with Node.js, React, PHP, and Nginx.

---

## 📋 Table of Contents

1. [Quick Start (5 minutes)](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Running Containers](#running-containers)
5. [Development Workflow](#development-workflow)
6. [Accessing Services](#accessing-services)
7. [Common Commands](#common-commands)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)
10. [Architecture Overview](#architecture-overview)

---

## 🚀 Quick Start

Get the application running in 5 minutes:

### 1. Install Prerequisites

```bash
# Check Docker is installed
docker --version          # Should be 20.10+
docker-compose --version  # Should be 2.0+

# If not installed, download from https://www.docker.com/products/docker-desktop
```

### 2. Clone Repository

```bash
git clone https://github.com/Labpro-22/milestone-1-tugas-besar-if-3110-web-based-development-k01-15.git
cd milestone-1-tugas-besar-if-3110-web-based-development-k01-15
```

### 3. Setup Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings (optional for development)
# vim .env
```

### 4. Start All Services

```bash
# Build and start all containers
docker-compose up -d --build

# Wait 30 seconds for services to fully start
sleep 30

# Verify all containers are running
docker-compose ps

# You should see:
# NAME                  STATUS
# nimonspedia-db        Up (healthy)
# nimonspedia-redis     Up
# nimonspedia-php       Up
# nimonspedia-node      Up (healthy)
# nimonspedia-nginx     Up (healthy)
# nimonspedia-pgadmin   Up
```

### 5. Access Application

```
Frontend (React SPA):    http://localhost/
PHP API:                 http://localhost/api/php/...
Node.js API:             http://localhost/api/node/...
WebSocket:               http://localhost/socket.io
PgAdmin (Database UI):   http://localhost:5050
```

### 6. Stop Services

```bash
docker-compose down

# Stop and remove volumes (⚠️ deletes data!)
docker-compose down -v
```

---

## ✅ Prerequisites

### Required

- **Docker Desktop** 20.10+ (includes Docker Engine + Compose)
  - [Download for macOS](https://docs.docker.com/desktop/install/mac-install/)
  - [Download for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Download for Linux](https://docs.docker.com/engine/install/)

- **Git** (for cloning repository)
  - [Download Git](https://git-scm.com/downloads)

- **4GB RAM minimum** (8GB recommended for comfortable development)

- **10GB free disk space** (for Docker images and database)

### Optional

- **VS Code** with Docker extension
- **Database client** (DBeaver, pgAdmin, etc.)
- **API testing tool** (Postman, Insomnia, Thunder Client)
- **Terminal** with bash/zsh/PowerShell

### System-Specific Notes

**macOS Intel/Apple Silicon:**
```bash
# Make sure Docker Desktop has sufficient resources:
# Docker Desktop → Settings → Resources
# - CPUs: 4+
# - Memory: 6GB+
# - Disk image size: 100GB
```

**Windows:**
```bash
# WSL 2 is recommended (Docker Desktop → Settings → General)
# Alternative: Hyper-V backend
# Make sure Virtualization is enabled in BIOS
```

**Linux:**
```bash
# After Docker installation, add user to docker group:
sudo usermod -aG docker $USER
newgrp docker

# Verify (should not require sudo):
docker ps
```

---

## 🔧 Environment Setup

### Configuration File

Create `.env` file in project root:

```bash
cp .env.example .env
```

### .env Variables

**Database Configuration:**
```env
DB_HOST=nimonspedia-db
DB_PORT=5432
DB_NAME=nimonspedia
DB_USER=nimonspedia_user
DB_PASSWORD=your_strong_password_here
```

**Application:**
```env
APP_ENV=development
APP_URL=http://localhost
SESSION_LIFETIME=3600
SESSION_NAME=nimonspedia_session
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=Lax
```

**Node.js:**
```env
NODE_ENV=development
NODE_PORT=3000
NODE_URL=http://localhost
```

**JWT (Admin Auth):**
```env
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=3600
```

**Web Push (Notifications):**
```bash
# Generate VAPID keys (only needed for push notifications)
npx web-push generate-vapid-keys

# Then add to .env:
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

**Redis (Optional, for session sharing):**
```env
REDIS_HOST=nimonspedia-redis
REDIS_PORT=6379
```

**CORS (API Access):**
```env
CORS_ORIGIN=http://localhost,http://localhost:3000,http://localhost:5173
```

**Database Admin UI (PgAdmin):**
```env
PGADMIN_DEFAULT_EMAIL=admin@nimonspedia.local
PGADMIN_DEFAULT_PASSWORD=admin_password
```

---

## 🐳 Running Containers

### Basic Docker Compose Commands

```bash
# Start all services (in foreground, see logs)
docker-compose up

# Start all services (in background/detached mode)
docker-compose up -d

# Build images and start
docker-compose up -d --build

# View logs of all services
docker-compose logs

# View logs of specific service
docker-compose logs nimonspedia-php
docker-compose logs nimonspedia-node

# Follow logs (real-time)
docker-compose logs -f

# Follow specific service logs
docker-compose logs -f nimonspedia-node

# Show running containers
docker-compose ps

# Stop all containers (keep volumes)
docker-compose stop

# Stop and remove containers (keep volumes)
docker-compose down

# Stop and remove containers AND volumes (⚠️ deletes data)
docker-compose down -v

# Restart containers
docker-compose restart

# Restart specific service
docker-compose restart nimonspedia-php

# Rebuild specific service image
docker-compose build nimonspedia-node
docker-compose build nimonspedia-react

# Rebuild all images
docker-compose build --no-cache
```

### Service-Specific Commands

**Execute command in container:**
```bash
# Run command in Node.js container
docker-compose exec nimonspedia-node npm install
docker-compose exec nimonspedia-node npm list

# Run command in PHP container
docker-compose exec nimonspedia-php php -v

# Open shell in container
docker-compose exec nimonspedia-node sh
docker-compose exec nimonspedia-db psql -U nimonspedia_user -d nimonspedia
```

**View container stats:**
```bash
docker-compose stats
```

### Interactive Development

**Watch logs while developing:**
```bash
# Terminal 1: Watch Node.js logs
docker-compose logs -f nimonspedia-node

# Terminal 2: Watch PHP logs
docker-compose logs -f nimonspedia-php

# Terminal 3: Run tests/commands
docker-compose exec nimonspedia-node npm run dev
```

---

## 💻 Development Workflow

### Local Code Changes

**The application uses volume mounts for live code reload:**

```yaml
# docker-compose.yml volumes:
nimonspedia-node:
  volumes:
    - ./node/src:/app/src          # Live reload on change
    - /app/node_modules             # Persist dependencies

nimonspedia-php:
  volumes:
    - ./php:/var/www/html           # Live reload on change

react (served by Nginx):
  volumes:
    - ./react/dist:/usr/share/nginx/html  # Static files
```

**Development process:**

```bash
# 1. Start containers
docker-compose up -d

# 2. Edit code in your editor (e.g., VS Code)
# Files are automatically synced to containers

# 3. Changes are live (no rebuild needed for most changes)
# - PHP changes: immediate
# - Node.js changes: auto-restart if nodemon enabled
# - React changes: rebuild then reload (see below)

# 4. Check logs if something breaks
docker-compose logs -f nimonspedia-node
```

### Rebuilding After Changes

**Node.js dependencies:**
```bash
# Install new package
docker-compose exec nimonspedia-node npm install axios

# Or rebuild entire image
docker-compose up -d --build nimonspedia-node
```

**React dependencies:**
```bash
# Install new package
docker-compose exec nimonspedia-react npm install react-router-dom

# Rebuild React SPA
docker-compose exec nimonspedia-react npm run build

# This updates dist/ which Nginx serves
```

**PHP dependencies (Composer):**
```bash
# If using Composer
docker-compose exec nimonspedia-php composer install
```

**Database changes:**
```bash
# Run new migration
docker-compose exec nimonspedia-db psql -U nimonspedia_user -d nimonspedia -f migration.sql

# Or connect and run manually
docker-compose exec nimonspedia-db psql -U nimonspedia_user -d nimonspedia
# Then in psql: \i migration.sql
```

---

## 🌐 Accessing Services

### Frontend

```
URL: http://localhost/

What you see:
- React SPA (index.html loaded)
- All React routing handled client-side
- API requests to /api/php/... and /api/node/...
- WebSocket connection to /socket.io
```

### PHP API

```
Direct access:
  http://localhost/api/php/products
  http://localhost/api/php/users
  http://localhost/api/php/orders

Through Nginx routing:
  GET /api/php/*  → Nginx routes to http://nimonspedia-php:8080

View PHP logs:
  docker-compose logs -f nimonspedia-php

Debug PHP errors:
  - Check browser console (JavaScript errors)
  - Check Network tab (PHP response status)
  - View Docker logs
```

### Node.js API

```
Direct access:
  http://localhost/api/node/auctions
  http://localhost/api/node/admin/users
  http://localhost/api/node/health

Through Nginx routing:
  GET /api/node/*     → Nginx routes to http://nimonspedia-node:3000
  GET /socket.io      → Nginx routes with WebSocket upgrade

View Node.js logs:
  docker-compose logs -f nimonspedia-node

Test API:
  curl http://localhost/api/node/health
  # Should return: {"status":"ok"}
```

### Database

**Using PgAdmin Web UI:**
```
URL: http://localhost:5050
Email: admin@nimonspedia.local (from .env)
Password: admin_password (from .env)

Steps:
1. Open http://localhost:5050
2. Login with credentials from .env
3. Add new server:
   - Hostname: nimonspedia-db
   - Username: nimonspedia_user
   - Password: (from .env)
4. Browse database, view tables, run queries
```

**Using Command Line:**
```bash
# Connect to PostgreSQL in container
docker-compose exec nimonspedia-db psql -U nimonspedia_user -d nimonspedia

# Common psql commands:
\dt                      # List tables
\d users                 # Describe table
SELECT * FROM users;     # Query data
\q                       # Quit
```

**Using Database Client:**
```
Connection details:
- Host: localhost (or 127.0.0.1)
- Port: 5432
- Database: nimonspedia
- User: nimonspedia_user
- Password: (from .env)

Clients:
- DBeaver (free, comprehensive)
- pgAdmin (web-based, simple)
- DataGrip (paid, powerful)
- VS Code PostgreSQL extension
```

### Redis (Optional)

```bash
# Connect to Redis CLI
docker-compose exec nimonspedia-redis redis-cli

# Common redis commands:
ping                     # Test connection
set key value           # Set key
get key                 # Get value
keys *                  # List all keys
del key                 # Delete key
flushall                # Clear all data
```

### WebSocket Testing

**In Browser Console:**
```javascript
// Connect to WebSocket
const socket = io('/');

// Listen for events
socket.on('connect', () => console.log('Connected'));
socket.on('bid_placed', (data) => console.log('Bid:', data));

// Emit events
socket.emit('join_auction', { auctionId: 1, userId: 5 });
socket.emit('place_bid', { auctionId: 1, bidAmount: 10000 });

// Check connection status
console.log(socket.connected);
```

**Using WebSocket Testing Tool:**
```
- Postman (has WebSocket support)
- WebSocket King Client (browser extension)
- wscat (command-line tool)

URL: ws://localhost/socket.io/
(Nginx routes to WebSocket server)
```

---

## 🔧 Common Commands

### Health Checks

```bash
# Check all services running
docker-compose ps

# Check service logs for errors
docker-compose logs nimonspedia-node

# Manually test services
curl http://localhost/api/node/health
curl http://localhost/api/php/health

# Check container resource usage
docker-compose stats
```

### Database Operations

```bash
# Backup database
docker-compose exec nimonspedia-db pg_dump -U nimonspedia_user nimonspedia > backup.sql

# Restore database
docker-compose exec -T nimonspedia-db psql -U nimonspedia_user nimonspedia < backup.sql

# Reset database (delete all data)
docker-compose down -v
docker-compose up -d

# View database size
docker-compose exec nimonspedia-db psql -U nimonspedia_user nimonspedia -c "\db"
```

### Node.js Development

```bash
# Install new package
docker-compose exec nimonspedia-node npm install package-name

# Run npm script
docker-compose exec nimonspedia-node npm run build

# Check Node version
docker-compose exec nimonspedia-node node --version

# Check installed packages
docker-compose exec nimonspedia-node npm list
```

### React Development

```bash
# Rebuild React SPA (if you changed source)
docker-compose exec nimonspedia-react npm run build

# Check React build size
du -sh react/dist/

# Update dependencies
docker-compose exec nimonspedia-react npm update
```

### File Operations

```bash
# Copy file from container to host
docker-compose cp nimonspedia-node:/app/file.txt ./file.txt

# Copy file from host to container
docker-compose cp ./file.txt nimonspedia-node:/app/file.txt

# List files in container
docker-compose exec nimonspedia-node ls -la /app/src/
```

### Container Debugging

```bash
# View container environment variables
docker-compose exec nimonspedia-node env

# View running processes
docker-compose exec nimonspedia-node ps aux

# Check disk space in container
docker-compose exec nimonspedia-node df -h

# View network connections
docker-compose exec nimonspedia-node netstat -tuln
```

### Docker Cleanup

```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Remove everything unused
docker system prune -a

# Check Docker disk usage
docker system df
```

---

## 🐛 Troubleshooting

### Container Won't Start

**Problem:** `docker-compose up` fails or containers crash

**Solution:**
```bash
# 1. Check logs for error
docker-compose logs

# 2. Check specific service
docker-compose logs nimonspedia-node

# 3. Full output with timestamps
docker-compose logs --timestamps

# 4. Rebuild from scratch
docker-compose down -v
docker-compose up -d --build

# 5. Check Docker daemon
docker ps  # Should work without errors
```

### Database Connection Error

**Problem:** "Cannot connect to database" error

**Solution:**
```bash
# 1. Check database container running
docker-compose ps nimonspedia-db

# 2. Wait for database to be ready (health check)
docker-compose logs nimonspedia-db | grep "ready"

# 3. Test connection
docker-compose exec nimonspedia-db psql -U nimonspedia_user -d nimonspedia -c "SELECT 1;"

# 4. Check .env variables match docker-compose.yml
grep DB_HOST .env
grep DB_USER .env
grep DB_PASSWORD .env

# 5. Reset database
docker-compose down -v
docker-compose up -d
sleep 30
```

### Port Already in Use

**Problem:** "Port 80 already in use" or similar

**Solution:**
```bash
# macOS/Linux: Find process using port
lsof -i :80

# Kill process (replace PID)
kill -9 PID

# Or change port in docker-compose.yml
# Change: ports: ["80:80"]
# To: ports: ["8080:80"]

# Windows: Find process
netstat -ano | findstr :80

# Kill process
taskkill /PID <PID> /F
```

### No Internet Connection in Container

**Problem:** Container can't access external URLs

**Solution:**
```bash
# 1. Check network
docker-compose exec nimonspedia-node ping google.com

# 2. Check DNS
docker-compose exec nimonspedia-node cat /etc/resolv.conf

# 3. Restart Docker daemon
# macOS: Docker menu → Restart
# Windows: Docker Desktop → Settings → Restart
# Linux: sudo systemctl restart docker

# 4. Recreate network
docker network prune -f
docker-compose down
docker-compose up -d
```

### WebSocket Connection Failed

**Problem:** Real-time features don't work

**Solution:**
```bash
# 1. Check Node.js is running
docker-compose ps nimonspedia-node

# 2. Check WebSocket route in Nginx
docker-compose logs nimonspedia-nginx | grep socket.io

# 3. Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost/socket.io/

# 4. Check Node.js logs
docker-compose logs -f nimonspedia-node

# 5. Check socket.io in browser console
# Open browser DevTools → Console → check socket.io errors
```

### React App Not Loading

**Problem:** "Cannot GET /" or blank page

**Solution:**
```bash
# 1. Check React build exists
docker-compose exec nimonspedia-react ls -la dist/

# 2. Check Nginx config
docker-compose exec nimonspedia-nginx cat /etc/nginx/nginx.conf | grep -A 10 "location /"

# 3. Rebuild React
docker-compose exec nimonspedia-react npm run build

# 4. Check Nginx logs
docker-compose logs nimonspedia-nginx

# 5. Test direct access
curl -i http://localhost/index.html

# 6. Clear browser cache (Ctrl+Shift+Del)
```

### High Memory Usage

**Problem:** Docker using too much memory

**Solution:**
```bash
# 1. Check resource usage
docker-compose stats

# 2. Check which container is heavy
docker stats

# 3. Reduce resource limits in docker-compose.yml
# Add to service:
# deploy:
#   resources:
#     limits:
#       memory: 512M
#     reservations:
#       memory: 256M

# 4. Restart with memory cleanup
docker-compose restart
```

### CORS Errors in Console

**Problem:** "Access to XMLHttpRequest blocked by CORS policy"

**Solution:**
```bash
# This shouldn't happen with Nginx as reverse proxy!
# If it does:

# 1. Check Nginx routing is correct
docker-compose logs nimonspedia-nginx

# 2. Verify request URL is /api/php/... not :8080
# In browser DevTools → Network → check request URL

# 3. Check origin in browser
console.log(window.location.origin)  # Should be http://localhost

# 4. If you see :8080 in URL, fix React API calls
# Wrong: fetch('http://localhost:8080/api/users')
# Right: fetch('/api/php/users')

# 5. Restart Nginx
docker-compose restart nimonspedia-nginx
```

### Can't Access Database Externally

**Problem:** Can't connect from Database client to `localhost:5432`

**Solution:**
```bash
# This is normal! PostgreSQL only listens inside Docker network

# Option 1: Use PgAdmin (http://localhost:5050) instead
# Option 2: Forward port temporarily
docker-compose exec nimonspedia-db psql -U nimonspedia_user

# Option 3: Add to docker-compose.yml for dev only:
# nimonspedia-db:
#   ports:
#     - "5432:5432"  # ADD THIS
# Then: docker-compose up -d
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

```bash
# 1. Build all images
docker-compose build --no-cache

# 2. Run tests
docker-compose exec nimonspedia-node npm test
docker-compose exec nimonspedia-react npm test

# 3. Check for vulnerabilities
docker-compose exec nimonspedia-node npm audit
docker-compose exec nimonspedia-react npm audit

# 4. Verify all services start cleanly
docker-compose down -v
docker-compose up -d
sleep 60
docker-compose ps

# 5. Run health checks
curl http://localhost/api/node/health
curl http://localhost/api/php/health
```

### Environment for Production

Create `.env.production`:
```env
APP_ENV=production
APP_URL=https://nimonspedia.com

NODE_ENV=production
JWT_SECRET=generate-very-long-random-secret-key

DB_PASSWORD=generate-strong-database-password

SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=Strict

CORS_ORIGIN=https://nimonspedia.com

# Disable PgAdmin in production
# Comment out pgadmin service in docker-compose.yml
```

### Docker Compose for Production

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  nimonspedia-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - nimonspedia-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  nimonspedia-node:
    build: ./node
    environment:
      NODE_ENV: production
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      nimonspedia-db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - nimonspedia-network

  nimonspedia-nginx:
    build: ./nginx
    ports:
      - "80:80"
      - "443:443"  # Add SSL
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro  # SSL certificates
    depends_on:
      - nimonspedia-php
      - nimonspedia-node
    restart: unless-stopped
    networks:
      - nimonspedia-network

volumes:
  postgres_data:

networks:
  nimonspedia-network:
    driver: bridge
```

### Deploy Command

```bash
# Deploy with production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or use custom production file
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🏗️ Architecture Overview

### Service Communication Map

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
│              (http://localhost/)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP/WebSocket
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Nginx (Port 80)                             │
│         Reverse Proxy & Static File Server              │
│                                                         │
│  GET /                 → React SPA (dist/index.html)   │
│  GET /api/php/*        → PHP Container (8080)          │
│  GET /api/node/*       → Node.js Container (3000)      │
│  GET /socket.io        → Node.js WebSocket             │
└────┬──────────────┬──────────────┬─────────────────────┘
     │              │              │
     ▼              ▼              ▼
┌─────────────┐ ┌──────────────┐ ┌──────────────────┐
│   PHP       │ │  Node.js     │ │  React (Nginx)   │
│ Container   │ │ Container    │ │  Container       │
│ Port 8080   │ │ Port 3000    │ │  Port 80         │
│             │ │              │ │                  │
│ - M1 code   │ │ - Auctions   │ │ - SPA files      │
│ - Auth      │ │ - Chat       │ │ - Static assets  │
│ - Products  │ │ - Admin API  │ │ - Compiled React │
│ - Orders    │ │ - WebSocket  │ │                  │
└──────┬──────┘ └──────┬───────┘ └──────────────────┘
       │                │
       └────────┬───────┘
                │
                ▼
        ┌──────────────────┐
        │  PostgreSQL      │
        │  Database        │
        │  Port 5432       │
        │                  │
        │ Shared by PHP    │
        │ and Node.js      │
        └──────────────────┘

        ┌──────────────────┐
        │  Redis           │
        │  Cache           │
        │  Port 6379       │
        │                  │
        │ Optional session │
        │ storage          │
        └──────────────────┘

        ┌──────────────────┐
        │  PgAdmin         │
        │  Web UI          │
        │  Port 5050       │
        │                  │
        │ Database admin   │
        └──────────────────┘
```

### Network Isolation

```
┌─────────────────────────────────────────────────────────┐
│        Docker Internal Network: nimonspedia-network     │
│                    (bridge driver)                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  All containers connected via service names:           │
│                                                         │
│  - nimonspedia-db                                       │
│  - nimonspedia-redis                                    │
│  - nimonspedia-php                                      │
│  - nimonspedia-node                                     │
│  - nimonspedia-nginx                                    │
│  - nimonspedia-pgadmin                                  │
│                                                         │
│  Internal communication (container → container):       │
│    Not exposed to host machine                         │
│    Host can only access exposed ports                  │
│                                                         │
└─────────────────────────────────────────────────────────┘

Exposed Ports (Host Machine):
  :80   → Nginx (main entry)
  :5050 → PgAdmin (admin UI)
  :5432 → PostgreSQL (if configured)
  :3000 → Node.js (if configured)
  :8080 → PHP (if configured)
```

### Data Flow Example: User Placing a Bid

```
1. User clicks "Place Bid" in React
   ↓
2. React component emits WebSocket event
   socket.emit('place_bid', {auctionId, bidAmount})
   ↓
3. Browser sends WebSocket message to /socket.io
   ↓
4. Nginx receives WebSocket upgrade request
   ↓
5. Nginx upgrades connection and forwards to Node.js:3000
   ↓
6. Node.js receives 'place_bid' event
   ↓
7. Node.js:
   - Validates bid (amount, buyer, auction)
   - Checks buyer balance via PostgreSQL
   - Inserts bid into auction_bids table
   - Updates auctions table
   ↓
8. Node.js broadcasts 'bid_placed' to all clients in room
   ↓
9. Nginx forwards broadcast to all connected clients
   ↓
10. All React components in AuctionDetail page receive event
    ↓
11. React updates state: bid history, countdown reset, UI update
    ↓
12. User sees bid placed successfully! ✅
```

---

## 📞 Support & Debugging

### Getting Help

1. **Check logs first:**
   ```bash
   docker-compose logs -f
   ```

2. **Check this README:** Most issues covered in [Troubleshooting](#troubleshooting)

3. **Consult specification:** `Spesifikasi Tugas Besar Milestone 2 IF3110 2025_2026.txt`

4. **Reference documentation:**
   - `MILESTONE_2_SETUP_GUIDE.md` - Detailed setup
   - `MILESTONE_2_ARCHITECTURE.md` - System architecture
   - `IMPLEMENTATION_BREAKDOWN.md` - Task breakdown

### Useful Docker Links

- Docker Documentation: https://docs.docker.com/
- Docker Compose Reference: https://docs.docker.com/compose/compose-file/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Node.js Docs: https://nodejs.org/docs/
- React Docs: https://react.dev/

---

## ✅ Verification Checklist

Before considering setup complete:

```bash
# 1. All containers running
docker-compose ps
# All should show "Up" status

# 2. Health checks passing
docker-compose ps | grep "healthy"

# 3. Can access frontend
curl http://localhost/ | grep -q "index.html"

# 4. Can access APIs
curl http://localhost/api/node/health | grep -q "ok"

# 5. Database is responsive
docker-compose exec nimonspedia-db psql -U nimonspedia_user -d nimonspedia -c "SELECT 1;"

# 6. WebSocket working
# Open browser console and test:
const socket = io('/'); socket.on('connect', () => console.log('Connected!'));

# 7. No errors in logs
docker-compose logs | grep -i "error" | wc -l
# Should be 0 or minimal

# 8. Can reach PgAdmin
curl http://localhost:5050 | head -20

# 9. File sync working (development)
echo "test" > node/src/test.txt
docker-compose exec nimonspedia-node cat /app/src/test.txt
# Should display "test"

# 10. Disk space available
docker system df
# Should have remaining space
```

---

## 🎯 Next Steps

1. **Run the application:** Follow [Quick Start](#quick-start)
2. **Explore services:** Visit all URLs listed in [Accessing Services](#accessing-services)
3. **Start development:** See [Development Workflow](#development-workflow)
4. **Begin implementation:** Check `IMPLEMENTATION_BREAKDOWN.md`
5. **Reference while coding:** Keep this README and spec nearby
6. **Commit regularly:** Push changes to Git

---

**Happy coding! 🚀**

For M2 implementation tasks, see: `IMPLEMENTATION_BREAKDOWN.md`  
For architecture details, see: `MILESTONE_2_ARCHITECTURE.md`  
For setup details, see: `MILESTONE_2_SETUP_GUIDE.md`

