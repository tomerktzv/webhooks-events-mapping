# NestJS Project Setup Guide

This guide will help you install all the necessary tools to run a NestJS project.

## Prerequisites

You need to install the following tools:

### 1. Node.js and npm

**Option A: Install via Homebrew (Recommended for macOS)**
```bash
# First, install Homebrew if you don't have it:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install Node.js (which includes npm):
brew install node
```

**Option B: Install via Node Version Manager (nvm) - Recommended**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal or run:
source ~/.zshrc

# Install the latest LTS version of Node.js
nvm install --lts
nvm use --lts
```

**Option C: Download from official website**
- Visit https://nodejs.org/
- Download and install the LTS version

### 2. Verify Installation

After installing Node.js, verify it's working:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### 3. Install NestJS CLI

Once Node.js and npm are installed, install the NestJS CLI globally:
```bash
npm install -g @nestjs/cli
```

Verify the installation:
```bash
nest --version
```

### 4. Create Your NestJS Project

After all prerequisites are installed, you can create a new NestJS project:
```bash
nest new project-name
```

Or if you want to initialize in the current directory:
```bash
nest new . --skip-git
```

## Quick Setup Script

Run the `setup.sh` script to check your environment and get installation instructions:
```bash
chmod +x setup.sh
./setup.sh
```
