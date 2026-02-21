#!/bin/bash

set -e

# Configuration
DOCKER_USER="boniyeamin"
PROJECT_NAME="netpulse-upguardx"
REGISTRY="docker.io"

# Get version from package.json, fallback to timestamp
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Building and Pushing Docker images for ${PROJECT_NAME} (v${VERSION})${NC}"
echo -e "${BLUE}📌 Registry: ${REGISTRY}/${DOCKER_USER}${NC}"
echo ""

# Check if Docker is running
echo -e "${BLUE}🔍 Checking Docker daemon...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker daemon is not running!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker daemon is running${NC}"
echo ""

# Function to build and push an image
build_and_push() {
    local service=$1
    local dockerfile=$2
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📦 Building ${service} image...${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    local image="${DOCKER_USER}/${PROJECT_NAME}-${service}"
    
    if docker build -t "${image}:${VERSION}" \
                   -t "${image}:latest" \
                   -f "${dockerfile}" .; then
        echo -e "${GREEN}✅ Build successful for ${service}${NC}"
        echo ""
        
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}📤 Pushing ${service} image to Docker Hub...${NC}"
        echo -e "${YELLOW}   ${image}:${VERSION}${NC}"
        echo -e "${YELLOW}   ${image}:latest${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        if docker push "${image}:${VERSION}" && docker push "${image}:latest"; then
            echo -e "${GREEN}✅ Push successful for ${service}${NC}"
            echo ""
        else
            echo -e "${RED}❌ Push failed for ${service}${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Build failed for ${service}${NC}"
        exit 1
    fi
}

# Build and push API image
build_and_push "api" "infrastructure/docker/Dockerfiles/api.Dockerfile"

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All Docker images built and pushed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Image Summary:${NC}"
echo -e "  ${YELLOW}API${NC}: ${DOCKER_USER}/${PROJECT_NAME}-api:${VERSION} & latest"
echo ""
echo -e "${BLUE}📖 To pull the images:${NC}"
echo -e "  ${YELLOW}docker pull ${DOCKER_USER}/${PROJECT_NAME}-api:latest${NC}"
echo -e "  ${YELLOW}docker pull ${DOCKER_USER}/${PROJECT_NAME}-api:${VERSION}${NC}"
echo ""
