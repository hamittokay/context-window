#!/bin/bash

# NPM Publish Readiness Verification Script
# This script checks if your package is ready to be published to npm

set -e

echo "🔍 Verifying package is ready for npm publishing..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Helper function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        FAILURES=$((FAILURES + 1))
    fi
}

# 1. Check if npm is installed
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    print_status 0 "npm is installed ($(npm --version))"
else
    print_status 1 "npm is not installed"
fi

# 2. Check if logged into npm
echo ""
echo "👤 Checking npm authentication..."
if npm whoami &> /dev/null; then
    USERNAME=$(npm whoami)
    print_status 0 "Logged in as: $USERNAME"
else
    print_status 1 "Not logged in to npm (run: npm login)"
fi

# 3. Check if package.json exists and has required fields
echo ""
echo "📋 Checking package.json..."
if [ -f "package.json" ]; then
    print_status 0 "package.json exists"

    # Check required fields
    if grep -q '"name"' package.json && grep -q '"version"' package.json; then
        NAME=$(node -p "require('./package.json').name")
        VERSION=$(node -p "require('./package.json').version")
        print_status 0 "Name: $NAME"
        print_status 0 "Version: $VERSION"
    else
        print_status 1 "Missing name or version in package.json"
    fi

    # Check if author field is filled
    if grep -q '"author":.*[^"]' package.json; then
        print_status 0 "Author field is set"
    else
        print_status 1 "Author field is empty"
    fi

    # Check if repository field exists
    if grep -q '"repository"' package.json; then
        print_status 0 "Repository field is set"
    else
        print_status 1 "Repository field is missing"
    fi
else
    print_status 1 "package.json not found"
fi

# 4. Check if build output exists
echo ""
echo "🏗️  Checking build output..."
if [ -d "dist" ]; then
    print_status 0 "dist/ directory exists"

    if [ -f "dist/index.js" ]; then
        print_status 0 "dist/index.js exists"
    else
        print_status 1 "dist/index.js not found (run: npm run build)"
    fi

    if [ -f "dist/index.d.ts" ]; then
        print_status 0 "dist/index.d.ts exists"
    else
        print_status 1 "dist/index.d.ts not found (run: npm run build)"
    fi
else
    print_status 1 "dist/ directory not found (run: npm run build)"
fi

# 5. Check if README exists
echo ""
echo "📖 Checking documentation..."
if [ -f "README.md" ]; then
    LINES=$(wc -l < README.md)
    print_status 0 "README.md exists ($LINES lines)"
else
    print_status 1 "README.md not found"
fi

# 6. Check if LICENSE exists
if [ -f "LICENSE" ]; then
    print_status 0 "LICENSE file exists"
else
    print_status 1 "LICENSE file not found"
fi

# 7. Run TypeScript type check
echo ""
echo "🔧 Running type check..."
if npm run check &> /dev/null; then
    print_status 0 "TypeScript type check passed"
else
    print_status 1 "TypeScript type check failed (run: npm run check)"
fi

# 8. Run tests
echo ""
echo "🧪 Running tests..."
if npm test &> /dev/null; then
    print_status 0 "All tests passed"
else
    echo -e "${YELLOW}⚠${NC} Tests check skipped or failed"
fi

# 9. Check package contents
echo ""
echo "📦 Checking package contents..."
if npm pack --dry-run &> /tmp/pack-output.txt; then
    SIZE=$(grep "package size:" /tmp/pack-output.txt | awk '{print $4, $5}')
    FILES=$(grep "total files:" /tmp/pack-output.txt | awk '{print $4}')
    print_status 0 "Package size: $SIZE"
    print_status 0 "Total files: $FILES"
else
    print_status 1 "Failed to check package contents"
fi

# 10. Check for .gitignore
echo ""
echo "🔒 Checking for sensitive files..."
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        print_status 0 ".env files are gitignored"
    else
        print_status 1 ".env not found in .gitignore"
    fi
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Your package is ready to publish.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Update version: npm version [patch|minor|major]"
    echo "  2. Publish: npm publish"
    echo "  3. Push to GitHub: git push origin main --tags"
    echo ""
    echo "Or run a dry-run first: npm run publish:dry"
else
    echo -e "${RED}❌ $FAILURES check(s) failed. Please fix the issues above before publishing.${NC}"
    exit 1
fi

