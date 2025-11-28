# Dependencies Installation Guide

Complete guide for installing all Node.js packages and dependencies before running Nimonspedia M2.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Node.js Package Installation](#nodejs-package-installation)
3. [Troubleshooting Installation Issues](#troubleshooting-installation-issues)
4. [Verification After Installation](#verification-after-installation)
5. [Quick Install Script](#quick-install-script)

---

## ✅ Prerequisites

Before installing packages, ensure you have:

### Required

- **Node.js 18+** installed on your system
  ```bash
  node --version  # Should be v18.0.0 or higher
  ```
  
  If not installed, download from: https://nodejs.org/

- **npm 9+** (comes with Node.js)
  ```bash
  npm --version   # Should be 9.0.0 or higher
  ```

- **Git** (for cloning repository)
  ```bash
  git --version
  ```

### Recommended

- **yarn** (optional, faster than npm)
  ```bash
  npm install -g yarn
  ```

- **nvm** (Node Version Manager - for managing multiple Node versions)
  - https://github.com/nvm-sh/nvm

---

## 🔧 Node.js Package Installation

### Step 1: Install Node.js Backend Dependencies

**Location:** `node/` directory

```bash
# Navigate to node directory
cd node

# Install all dependencies from package.json
npm install

# Expected output:
# added 150 packages, and audited 151 packages in 45s

# Verify installation
npm list

# You should see all packages listed with versions
```

**What gets installed:**
```
Dependencies:
├─ express              (Web framework)
├─ socket.io            (WebSocket library)
├─ pg                   (PostgreSQL client)
├─ bcryptjs             (Password hashing)
└─ jsonwebtoken         (JWT authentication)

Dev Dependencies:
├─ nodemon              (Auto-restart on file changes)
└─ eslint               (Code linter)
```

**Time:** 1-2 minutes

---

### Step 2: Install React Frontend Dependencies

**Location:** `react/` directory

```bash
# Go back to project root
cd ..

# Navigate to react directory
cd react

# Install all dependencies from package.json
npm install

# Expected output:
# added 380 packages, and audited 381 packages in 2m

# Verify installation
npm list

# You should see all packages listed
```

**What gets installed:**
```
Dependencies:
├─ react               (UI library)
├─ react-dom           (React rendering)
├─ react-router-dom    (Client-side routing)
├─ axios               (HTTP client)
├─ socket.io-client    (WebSocket client)
└─ vite                (Build tool)

Dev Dependencies:
├─ @vitejs/plugin-react  (Vite React support)
├─ @types/react          (TypeScript types)
├─ @types/react-dom      (TypeScript types)
└─ terser                (Code minifier)
```

**Time:** 2-3 minutes

---

### Step 3: Return to Project Root

```bash
# Go back to project root
cd ..

# Verify you're in the right location
# You should see: docker-compose.yml in current directory
ls docker-compose.yml
```

---

## 🐛 Troubleshooting Installation Issues

### Issue 1: "npm command not found"

**Problem:** npm is not in your PATH

**Solution:**
```bash
# Verify Node is installed
node --version

# If Node exists but npm doesn't, reinstall Node.js
# Download from: https://nodejs.org/

# On Windows: Run installer again
# On macOS: brew install node
# On Linux: sudo apt-get install nodejs npm
```

---

### Issue 2: "ERR! Code EACCES"

**Problem:** Permission denied when installing packages

**Solution (macOS/Linux):**
```bash
# Option 1: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Option 2: Use sudo (not recommended)
sudo npm install
```

**Solution (Windows):**
- Run PowerShell as Administrator
- Then run `npm install`

---

### Issue 3: "ERESOLVE unable to resolve dependency tree"

**Problem:** Conflicting package versions

**Solution:**
```bash
# Use legacy peer dependencies flag
npm install --legacy-peer-deps

# Or use npm 7+ resolution
npm install --force
```

---

### Issue 4: Terser Not Found During Build

**Problem:** Build fails with "terser not found"

**Solution:**
```bash
# Install terser specifically
cd react
npm install terser@5.44.1 --save-dev

# Try building again
npm run build
```

---

### Issue 5: "node_modules" Directory Corrupted

**Problem:** Mysterious build/runtime errors after installation

**Solution:**
```bash
# Option 1: Clean install (recommended)
rm -rf node_modules package-lock.json  # macOS/Linux
rmdir /s node_modules; del package-lock.json  # Windows

npm install

# Option 2: Clean cache then install
npm cache clean --force
npm install
```

---

### Issue 6: ENOMEM Out of Memory

**Problem:** Installation fails with out of memory error

**Solution:**
```bash
# Increase Node heap size
set NODE_OPTIONS=--max-old-space-size=4096  # Windows
export NODE_OPTIONS=--max-old-space-size=4096  # macOS/Linux

npm install
```

---

### Issue 7: Network Timeout

**Problem:** Installation fails with network errors

**Solution:**
```bash
# Increase timeout
npm install --timeout=120000

# Or use yarn (often faster)
yarn install
```

---

### Issue 8: Python Installation Required

**Problem:** Some packages require Python (bcryptjs builds native modules)

**Solution:**

**Windows:**
- Install from: https://www.python.org/
- Or use: `choco install python`

**macOS:**
- Already installed or: `brew install python3`

**Linux:**
- `sudo apt-get install python3`

---

## ✅ Verification After Installation

After installing all packages, verify everything is correct:

### 1. Check Node.js Backend

```bash
cd node

# Verify all packages
npm list

# Expected output shows tree of installed packages
# No red errors

# Check specific critical packages
npm list express
npm list socket.io
npm list pg
npm list bcryptjs
npm list jsonwebtoken

# All should show versions without errors
```

**Successful output example:**
```
node@2.0.0
├── axios@1.6.5
├── express@4.18.2
├── socket.io@4.7.2
├── pg@8.11.3
├── bcryptjs@2.4.3
└── jsonwebtoken@9.1.2
```

---

### 2. Check React Frontend

```bash
cd ../react

# Verify all packages
npm list

# Expected: Tree of packages, no errors

# Check specific critical packages
npm list react
npm list react-dom
npm list react-router-dom
npm list axios
npm list socket.io-client
npm list vite
npm list terser

# All should show versions
```

**Successful output example:**
```
nimonspedia-react-spa@2.0.0
├── axios@1.6.5
├── react@18.2.0
├── react-dom@18.2.0
├── react-router-dom@6.20.1
├── socket.io-client@4.7.2
└── vite@5.0.8
```

---

### 3. Test Node.js Backend

```bash
cd ../node

# Try starting the server (will run until you stop it)
npm run dev

# Expected output:
# Server listening on port 3000
# Connected to database: nimonspedia

# Press Ctrl+C to stop
```

---

### 4. Test React Build

```bash
cd ../react

# Build React for production
npm run build

# Expected output:
# ✓ 31 modules transformed
# dist/index.html       0.46 kB
# dist/assets/main.js   1.23 kB

# This creates dist/ folder with built files
```

---

### 5. Check for Vulnerabilities

```bash
# Check Node.js dependencies
cd ../node
npm audit

# Check React dependencies
cd ../react
npm audit

# Output shows any known vulnerabilities
# Most are minor and safe to ignore for development
```

---

## 🚀 Quick Install Script

### All-in-One Installation

Copy and paste this entire script to install everything at once:

#### **Windows PowerShell:**

```powershell
# Verify prerequisites
Write-Host "Checking Node.js version..."
node --version

Write-Host "Checking npm version..."
npm --version

# Navigate to project root
Write-Host "Installing Node.js backend dependencies..."
cd node
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "Node.js installation failed"; exit 1 }

# Install React
Write-Host "Installing React frontend dependencies..."
cd ../react
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "React installation failed"; exit 1 }

# Go back to root
cd ..

Write-Host "✅ All dependencies installed successfully!"
Write-Host "Next: Run 'docker-compose up -d --build'"
```

#### **macOS/Linux Bash:**

```bash
#!/bin/bash

# Verify prerequisites
echo "Checking Node.js version..."
node --version

echo "Checking npm version..."
npm --version

# Install Node.js backend
echo "Installing Node.js backend dependencies..."
cd node
npm install || { echo "Node.js installation failed"; exit 1; }

# Install React
echo "Installing React frontend dependencies..."
cd ../react
npm install || { echo "React installation failed"; exit 1; }

# Go back to root
cd ..

echo "✅ All dependencies installed successfully!"
echo "Next: Run 'docker-compose up -d --build'"
```

**To run the bash script:**
```bash
chmod +x install-dependencies.sh
./install-dependencies.sh
```

---

## 📊 Installation Summary

| Component | Location | Packages | Time | Status |
|-----------|----------|----------|------|--------|
| **Node.js Backend** | `node/` | 150+ | 1-2 min | ⏳ |
| **React Frontend** | `react/` | 380+ | 2-3 min | ⏳ |
| **Build Verification** | Both | All | 1-2 min | ⏳ |
| **Total Time** | — | 530+ | **5-8 min** | — |

---

## 🎯 What Happens After Installation

Once all packages are installed:

1. **Backend Node.js** has:
   - Express server ready to run
   - Socket.io for real-time communication
   - PostgreSQL client for database
   - JWT authentication ready
   - Nodemon for auto-restart during development

2. **Frontend React** has:
   - React components ready to develop
   - React Router for page navigation
   - Axios for API calls
   - Socket.io client for WebSocket
   - Vite for fast builds
   - Terser for code minification

3. **You can now**:
   - Start developing without network access (all packages local)
   - Run Docker containers with all dependencies
   - Build and test the application
   - Deploy to production

---

## ✅ Next Steps After Installation

Once dependencies are installed:

```bash
# 1. Setup environment file
cp .env.example .env

# 2. Create database schema
mkdir -p db/migrations
# (add SQL files)

# 3. Start Docker containers
docker-compose up -d --build

# 4. Verify services are healthy
docker-compose ps

# 5. Access the application
# Frontend: http://localhost/
# Node API: http://localhost:3000/api/node/health
# PgAdmin: http://localhost:5050
```

---

## 📞 Need Help?

If installation fails:

1. **Check error message** - Most errors are self-explanatory
2. **See Troubleshooting section** above for your specific error
3. **Check internet connection** - Packages downloaded from npm registry
4. **Check disk space** - Need at least 5GB free
5. **Check Node/npm versions** - Must be relatively recent

---

## 🔒 Security Note

After installation, you may see security warnings:

```
found 15 vulnerabilities (8 moderate, 7 low)
```

This is **normal and expected**. Most vulnerabilities:
- Are in dev dependencies only
- Don't affect runtime security
- Are already patched in latest versions

**For production**, run:
```bash
npm audit fix
```

---

## 📋 Checklist

Before starting development, verify:

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] `cd node && npm install` completed successfully
- [ ] `cd ../react && npm install` completed successfully
- [ ] No red errors in npm output
- [ ] `npm list` shows all packages
- [ ] `.env` file created
- [ ] Docker available on system
- [ ] 5GB+ free disk space available
- [ ] Network connection stable

✅ **All checked? Ready to run Docker and start development!**

---

**Happy coding! 🚀**

For running the application, see: `README_2.0_DOCKER_GUIDE.md`  
For implementation tasks, see: `IMPLEMENTATION_BREAKDOWN.md`  
For architecture details, see: `MILESTONE_2_ARCHITECTURE.md`

