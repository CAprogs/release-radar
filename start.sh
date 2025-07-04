#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Release Radar - Quick Start Script${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}❌ Please edit the .env file and add your GOOGLE_API_KEY${NC}"
    echo -e "${BLUE}   Get your API key from: https://ai.google.dev/${NC}"
    exit 1
fi

# Check if GOOGLE_API_KEY is set
if ! grep -q "GOOGLE_API_KEY=your_google_api_key_here" .env; then
    echo -e "${GREEN}✅ API key seems to be configured${NC}"
else
    echo -e "${RED}❌ Please set your GOOGLE_API_KEY in the .env file${NC}"
    echo -e "${BLUE}   Get your API key from: https://ai.google.dev/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration looks good!${NC}"
echo ""
echo -e "${BLUE}Choose how to run Release Radar:${NC}"
echo -e "${BLUE}1) Local development (npm run dev)${NC}"
echo -e "${BLUE}2) Development with Docker${NC}"
echo -e "${BLUE}3) Production with Docker${NC}"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 Starting local development server...${NC}"
        npm run dev
        ;;
    2)
        echo -e "${GREEN}🚀 Starting development with Docker...${NC}"
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    3)
        echo -e "${GREEN}🚀 Starting production with Docker...${NC}"
        docker-compose up --build
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac
