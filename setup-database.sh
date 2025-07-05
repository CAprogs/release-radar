#!/bin/bash

# Database setup script for Release Radar
# This script sets up the database for local development

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  Release Radar - Database Setup${NC}"
echo -e "${BLUE}===================================${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
fi

# Start database if not running
echo -e "${YELLOW}🚀 Starting database...${NC}"
docker-compose up -d db

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
for i in {1..30}; do
    if timeout 2 bash -c "echo >/dev/tcp/localhost/5432" 2>/dev/null; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Database failed to start${NC}"
        exit 1
    fi
    sleep 1
done

# Push database schema
echo -e "${YELLOW}📋 Setting up database schema...${NC}"
npx prisma db push

# Generate Prisma client
echo -e "${YELLOW}🔄 Generating Prisma client...${NC}"
npx prisma generate

# Check if database is empty and seed if needed
echo -e "${YELLOW}🌱 Checking if database needs seeding...${NC}"
tables_count=$(docker-compose exec db psql -U releaseradar -d releaseradar -t -c "SELECT COUNT(*) FROM repositories;" 2>/dev/null || echo "0")

if [ "${tables_count// /}" = "0" ]; then
    echo -e "${YELLOW}🌱 Seeding database with sample data...${NC}"
    npm run db:seed
    echo -e "${GREEN}✅ Database seeded successfully${NC}"
else
    echo -e "${GREEN}✅ Database already contains data${NC}"
fi

echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo -e "${BLUE}You can now start the application with:${NC}"
echo -e "${BLUE}  npm run dev${NC}"
echo -e "${BLUE}  or${NC}"
echo -e "${BLUE}  ./start.sh${NC}"
