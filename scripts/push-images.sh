#!/bin/bash

# Configuration
DOCKER_USER="boniyeamin"
PROJECT_NAME="netpulse-upguardx"
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "latest")

# Colors for output
GREEN='\033[0-9;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Building and Pushing Docker images for ${PROJECT_NAME} (v${VERSION})${NC}"

# 1. API Image
echo -e "${GREEN}📦 Building API image...${NC}"
docker build -t ${DOCKER_USER}/${PROJECT_NAME}-api:${VERSION} \
             -t ${DOCKER_USER}/${PROJECT_NAME}-api:latest \
             -f infrastructure/docker/Dockerfiles/api.Dockerfile .

echo -e "${GREEN}📤 Pushing API image to Docker Hub...${NC}"
docker push ${DOCKER_USER}/${PROJECT_NAME}-api:${VERSION}
docker push ${DOCKER_USER}/${PROJECT_NAME}-api:latest

echo -e "${GREEN}✅ All images pushed successfully!${NC}"
