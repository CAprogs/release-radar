#!/bin/bash

# Test workflow script for Release Radar
# This script validates the complete application workflow

set -e

echo "🧪 Testing Release Radar Workflow"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_health() {
    echo -e "${YELLOW}Testing health endpoint...${NC}"
    response=$(curl -s -w "%{http_code}" http://localhost:3000/api/health)
    http_code="${response: -3}"
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
        return 0
    else
        echo -e "${RED}❌ Health endpoint failed (HTTP $http_code)${NC}"
        return 1
    fi
}

test_database() {
    echo -e "${YELLOW}Testing database connectivity...${NC}"
    
    # Test if tables exist
    tables=$(docker-compose exec db psql -U releaseradar -d releaseradar -t -c "\dt" 2>/dev/null | grep -c "table" || echo "0")
    
    if [ "$tables" -ge 3 ]; then
        echo -e "${GREEN}✅ Database tables exist${NC}"
        return 0
    else
        echo -e "${RED}❌ Database tables missing${NC}"
        return 1
    fi
}

test_frontend() {
    echo -e "${YELLOW}Testing frontend accessibility...${NC}"
    
    # Test if frontend is accessible
    status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✅ Frontend accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ Frontend not accessible (HTTP $status)${NC}"
        return 1
    fi
}

test_containers() {
    echo -e "${YELLOW}Testing container status...${NC}"
    
    # Check if containers are running
    app_running=$(docker-compose ps -q release-radar | wc -l)
    db_running=$(docker-compose ps -q db | wc -l)
    
    if [ "$app_running" -eq 1 ] && [ "$db_running" -eq 1 ]; then
        echo -e "${GREEN}✅ All containers running${NC}"
        return 0
    else
        echo -e "${RED}❌ Some containers not running${NC}"
        return 1
    fi
}

# Run all tests
echo "Starting tests..."
echo

failed=0

test_containers || ((failed++))
test_database || ((failed++))
test_health || ((failed++))
test_frontend || ((failed++))

echo
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Release Radar is working correctly.${NC}"
    echo
    echo "You can now:"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Configure your project settings"
    echo "3. Add GitHub repositories to track"
    echo "4. Analyze release impacts with AI"
    echo
    echo "Don't forget to set your GOOGLE_API_KEY in the .env file!"
else
    echo -e "${RED}❌ $failed test(s) failed. Check the logs above.${NC}"
    exit 1
fi
