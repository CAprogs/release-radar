#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Release Radar - Environment Validation${NC}"
echo -e "${BLUE}==========================================${NC}"

# Check if .env file exists
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Check if GOOGLE_API_KEY is set
if grep -q "GOOGLE_API_KEY=" .env && ! grep -q "GOOGLE_API_KEY=your_google_api_key_here" .env; then
    echo -e "${GREEN}✅ GOOGLE_API_KEY is configured${NC}"
else
    echo -e "${RED}❌ GOOGLE_API_KEY is not properly configured${NC}"
    echo -e "${BLUE}   Please set your API key in the .env file${NC}"
    exit 1
fi

# Check if Docker is installed and running
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
    if docker info &> /dev/null; then
        echo -e "${GREEN}✅ Docker is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker is installed but not running${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker is not installed${NC}"
fi

# Check if Docker Compose is available
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose is available${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose is not available${NC}"
fi

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js is installed: ${NODE_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js is not installed${NC}"
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm is installed: v${NPM_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠️  npm is not installed${NC}"
fi

# Check if public directory exists
if [ -d "public" ]; then
    echo -e "${GREEN}✅ public directory exists${NC}"
else
    echo -e "${YELLOW}⚠️  public directory not found${NC}"
fi

# Check if favicon exists
if [ -f "public/favicon.ico" ]; then
    echo -e "${GREEN}✅ favicon.ico exists in public directory${NC}"
else
    echo -e "${YELLOW}⚠️  favicon.ico not found in public directory${NC}"
fi

echo ""
echo -e "${BLUE}🎉 Environment validation complete!${NC}"
echo -e "${BLUE}You can now run the application using:${NC}"
echo -e "${BLUE}  - ./start.sh (recommended)${NC}"
echo -e "${BLUE}  - npm run dev (local development)${NC}"
echo -e "${BLUE}  - docker-compose up --build (production)${NC}"
