# Docker Setup & Deployment Guide

## 📦 Overview

NetPulse UpGuardX uses Docker for containerization and deployment. All services are available on Docker Hub under the `boniyeamin` account.

---

## 🐳 Available Docker Images

| Service | Image | Size | Status |
|---------|-------|------|--------|
| **API** | `boniyeamin/netpulse-upguardx-api` | 367MB | ✅ |

**Image Tags:**
- `latest` - Most recent build
- `1.0.0` - Version tag
- Semver versions (e.g., `1.0.1`, `1.1.0`) when released

---

## 🚀 Quick Start with Docker

### Option 1: Using Docker Hub Images (Recommended for Production)

```bash
# Pull the latest API image
docker pull boniyeamin/netpulse-upguardx-api:latest

# Or pull a specific version
docker pull boniyeamin/netpulse-upguardx-api:1.0.0

# Run with Docker Compose (see below)
```

### Option 2: Using Docker Compose (Easiest for Development)

Navigate to the project root and run:

```bash
# Start all services (API + dependencies: PostgreSQL, Redis)
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# Stop all services
docker-compose -f infrastructure/docker/docker-compose.yml down

# Remove volumes (WARNING: deletes data)
docker-compose -f infrastructure/docker/docker-compose.yml down -v
```

**Services Started:**
- **PostgreSQL** (Port 5433): Database
- **Redis** (Port 6379): Cache & Job Queue

**Default Credentials:**
- DB User: `netpulse`
- DB Password: `password`
- DB Name: `netpulse_dev`

---

## 🛠️ Building Docker Images Locally

### Prerequisites

```bash
# Install pnpm globally
npm install -g pnpm

# Install dependencies
pnpm install
```

### Build Individual Images

**Build API Image:**
```bash
docker build -t boniyeamin/netpulse-upguardx-api:latest \
             -f infrastructure/docker/Dockerfiles/api.Dockerfile .
```

### Automated Build & Push Script

Use the provided `push-images.sh` script to build and push all images:

```bash
# Make script executable
chmod +x scripts/push-images.sh

# Run the script
./scripts/push-images.sh
```

**What the script does:**
✅ Validates Docker daemon is running  
✅ Builds all service images  
✅ Pushes to Docker Hub (`docker.io/boniyeamin/*`)  
✅ Tags with both version and latest  
✅ Shows detailed build progress and summary  

**Requirements for pushing:**
- Docker Hub account with push access to `boniyeamin` repositories
- Run `docker login -u boniyeamin` before pushing

---

## 🔐 Docker Hub Authentication

### Login to Docker Hub

```bash
docker login -u boniyeamin
# Enter password/token when prompted

# Verify login
docker info | grep Username
```

### Using Personal Access Token (Recommended)

For CI/CD pipelines, use a Personal Access Token instead of password:

1. Go to Docker Hub → Account Settings → Security
2. Create a new Personal Access Token
3. Use the token as password when logging in:

```bash
echo "YOUR_TOKEN" | docker login -u boniyeamin --password-stdin
```

---

## 📊 Dockerfile Architecture

### API Dockerfile (Multi-stage Build)

**Build Stage:**
- Base: `node:20-slim`
- Installs pnpm
- Installs dependencies
- Builds TypeScript

**Production Stage:**
- Base: `node:20-slim`
- Non-root user (nodejs:1001)
- OpenSSL installed for Prisma
- Optimized for security

**Key Features:**
- Multi-stage reduces final image size (367MB)
- Minimal runtime dependencies
- Non-root user execution (security best practice)
- Prisma migrations ready

---

## 🔍 Running Docker Images

### Run API Locally

```bash
# Run with environment variables
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://netpulse:password@postgres:5432/netpulse_dev" \
  -e REDIS_URL="redis://redis:6379" \
  boniyeamin/netpulse-upguardx-api:latest
```

### Using Docker Network

```bash
# Create a custom network
docker network create netpulse-network

# Run PostgreSQL
docker run --network netpulse-network \
  --name netpulse-db \
  -e POSTGRES_USER=netpulse \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=netpulse_dev \
  postgres:15-alpine

# Run API on same network
docker run --network netpulse-network \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://netpulse:password@netpulse-db:5432/netpulse_dev" \
  -e REDIS_URL="redis://redis:6379" \
  boniyeamin/netpulse-upguardx-api:latest
```

---

## 📋 Environment Variables

### Required for API Container

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379
JWT_SECRET=your-secret-key
```

### See Full Options

Check [apps/api/.env.example](../apps/api/.env.example) for all available environment variables.

---

## 🐛 Troubleshooting

### Image Won't Build

```bash
# Clear Docker cache and rebuild
docker build --no-cache \
  -t boniyeamin/netpulse-upguardx-api:latest \
  -f infrastructure/docker/Dockerfiles/api.Dockerfile .
```

### Can't Connect to Database

```bash
# Verify database is running
docker ps | grep netpulse-db

# Check logs
docker logs netpulse-db

# Test connection from API container
docker exec -it netpulse-api psql -h netpulse-db -U netpulse -d netpulse_dev
```

### Push Fails

```bash
# Verify Docker Hub login
docker info | grep Username

# Re-login
docker logout
docker login -u boniyeamin
```

---

## 📈 Image Build Status

| Service | Latest Build | Size | Last Updated |
|---------|--------------|------|--------------|
| API | ✅ Ready | 367MB | 2026-02-21 |

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Hub Registry](https://hub.docker.com/r/boniyeamin/netpulse-upguardx-api)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)

---

> Last Updated: 2026-02-21 | NetPulse Dev Team
