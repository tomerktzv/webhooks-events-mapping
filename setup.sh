#!/bin/bash

# Load nvm if it exists and node is not in PATH
if [ -s "$HOME/.nvm/nvm.sh" ] && ! command -v node &> /dev/null; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm use default &> /dev/null
fi

echo "=========================================="
echo "NestJS Project Setup Checker"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Installed${NC} (${NODE_VERSION})"
    NODE_INSTALLED=true
else
    echo -e "${RED}✗ Not installed${NC}"
    NODE_INSTALLED=false
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ Installed${NC} (${NPM_VERSION})"
    NPM_INSTALLED=true
else
    echo -e "${RED}✗ Not installed${NC}"
    NPM_INSTALLED=false
fi

# Check NestJS CLI
echo -n "Checking NestJS CLI... "
if command -v nest &> /dev/null; then
    NEST_VERSION=$(nest --version 2>/dev/null)
    echo -e "${GREEN}✓ Installed${NC} (${NEST_VERSION})"
    NEST_INSTALLED=true
else
    echo -e "${RED}✗ Not installed${NC}"
    NEST_INSTALLED=false
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="

if [ "$NODE_INSTALLED" = true ] && [ "$NPM_INSTALLED" = true ] && [ "$NEST_INSTALLED" = true ]; then
    echo -e "${GREEN}✓ All prerequisites are installed!${NC}"
    echo ""
    echo "You can now create a NestJS project with:"
    echo "  nest new project-name"
    echo ""
    echo "Or initialize in the current directory:"
    echo "  nest new . --skip-git"
    exit 0
else
    echo -e "${YELLOW}⚠ Some prerequisites are missing.${NC}"
    echo ""
    
    if [ "$NODE_INSTALLED" = false ] || [ "$NPM_INSTALLED" = false ]; then
        echo "You need to install Node.js and npm first."
        echo ""
        echo "Recommended installation methods:"
        echo ""
        echo "1. Using Homebrew (macOS):"
        echo "   brew install node"
        echo ""
        echo "2. Using nvm (Node Version Manager):"
        echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        echo "   source ~/.zshrc"
        echo "   nvm install --lts"
        echo "   nvm use --lts"
        echo ""
        echo "3. Download from https://nodejs.org/"
        echo ""
    fi
    
    if [ "$NEST_INSTALLED" = false ] && [ "$NPM_INSTALLED" = true ]; then
        echo "Install NestJS CLI with:"
        echo "  npm install -g @nestjs/cli"
        echo ""
    fi
    
    echo "After installing, run this script again to verify."
    exit 1
fi
