#!/bin/bash
# ============================================================================
# Predator Analytics E2E Test Runner
# 
# Usage:
#   ./run_e2e_tests.sh [options]
#
# Options:
#   --local     Run tests against local environment (localhost:8082)
#   --remote    Run tests against remote server (requires REMOTE_URL env var)
#   --headed    Run tests in headed mode (visible browser)
#   --spec      Run specific spec file (e.g., --spec full-cycle)
#   --open      Open Cypress interactive mode
#   --generate  Generate test data first
#   --report    Generate HTML report after tests
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BASE_URL="${CYPRESS_BASE_URL:-http://localhost:8082}"
IS_LOCAL="true"
HEADED=""
SPEC=""
OPEN_MODE=""
GENERATE_DATA=""
GENERATE_REPORT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            BASE_URL="http://localhost:8082"
            IS_LOCAL="true"
            shift
            ;;
        --remote)
            if [ -z "$REMOTE_URL" ]; then
                echo -e "${RED}Error: REMOTE_URL environment variable not set${NC}"
                exit 1
            fi
            BASE_URL="$REMOTE_URL"
            IS_LOCAL="false"
            shift
            ;;
        --headed)
            HEADED="--headed"
            shift
            ;;
        --spec)
            SPEC="--spec cypress/integration/$2.cy.ts"
            shift 2
            ;;
        --open)
            OPEN_MODE="true"
            shift
            ;;
        --generate)
            GENERATE_DATA="true"
            shift
            ;;
        --report)
            GENERATE_REPORT="true"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Change to e2e directory
cd "$(dirname "$0")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Predator Analytics E2E Test Runner                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Base URL:    ${GREEN}$BASE_URL${NC}"
echo -e "  Environment: ${GREEN}$([ "$IS_LOCAL" = "true" ] && echo "Local (Mac)" || echo "Remote Server")${NC}"
echo -e "  Mode:        ${GREEN}$([ "$OPEN_MODE" = "true" ] && echo "Interactive" || echo "Headless")${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Generate test data if requested
if [ "$GENERATE_DATA" = "true" ]; then
    echo -e "${YELLOW}Generating test data...${NC}"
    
    # Use Python generator
    cd ../..
    python -c "
from ua_sources.app.services.test_data_generator import get_test_data_generator
generator = get_test_data_generator()
result = generator.generate_xlsx('tests/e2e/cypress/fixtures/Березень_2024.xlsx', 500)
print(f'Generated {result[\"row_count\"]} records')
" 2>/dev/null || echo "Using existing test data"
    cd tests/e2e
    
    echo -e "${GREEN}✓ Test data ready${NC}"
fi

# Run tests
if [ "$OPEN_MODE" = "true" ]; then
    echo -e "${YELLOW}Opening Cypress interactive mode...${NC}"
    CYPRESS_BASE_URL="$BASE_URL" IS_LOCAL="$IS_LOCAL" npx cypress open --config-file cypress.config.ts
else
    echo -e "${YELLOW}Running Cypress tests...${NC}"
    echo ""
    
    # Set environment variables and run
    export CYPRESS_BASE_URL="$BASE_URL"
    export IS_LOCAL="$IS_LOCAL"
    
    CYPRESS_CMD="npx cypress run --config-file cypress.config.ts $HEADED $SPEC"
    
    if [ "$GENERATE_REPORT" = "true" ]; then
        CYPRESS_CMD="$CYPRESS_CMD --reporter mochawesome --reporter-options reportDir=cypress/reports,overwrite=false,html=false,json=true"
    fi
    
    eval $CYPRESS_CMD
    
    TEST_EXIT_CODE=$?
    
    # Generate HTML report if requested
    if [ "$GENERATE_REPORT" = "true" ]; then
        echo -e "${YELLOW}Generating HTML report...${NC}"
        npx mochawesome-merge cypress/reports/*.json > cypress/reports/merged-report.json
        npx marge cypress/reports/merged-report.json -f report -o cypress/reports
        echo -e "${GREEN}✓ Report generated: cypress/reports/report.html${NC}"
    fi
    
    echo ""
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    ALL TESTS PASSED ✓                      ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    else
        echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                    SOME TESTS FAILED ✗                     ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    fi
    
    exit $TEST_EXIT_CODE
fi
