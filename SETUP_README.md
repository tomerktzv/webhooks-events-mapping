# NestJS Project Setup

✅ **All prerequisites are installed!** You're ready to create your NestJS project.

## Quick Start

**Everything is installed and ready!** You can now create your NestJS project:

```bash
# Create a new project in a subdirectory:
nest new my-project

# Or initialize in the current directory:
nest new . --skip-git
```

## Installation Details

The following tools have been installed:
- ✅ **Node.js** v24.13.0 (via nvm)
- ✅ **npm** v11.6.2
- ✅ **NestJS CLI** v11.0.16

**Note:** nvm (Node Version Manager) has been installed and configured. In new terminal sessions, nvm will automatically load. If you need to use Node.js in the current session, run:
```bash
source ~/.zshrc
```

## Previous Installation Steps (Already Completed)

1. **Installed nvm (Node Version Manager)**
2. **Installed Node.js and npm** (via nvm)
3. **Installed NestJS CLI** (globally)

## Manual Installation (Reference Only)

If you need to reinstall or install on another machine:

   **Option A: Using Homebrew (Recommended for macOS)**
   ```bash
   # Install Homebrew if needed:
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install Node.js:
   brew install node
   ```

   **Option B: Using nvm (Node Version Manager) - Best for managing multiple versions**
   ```bash
   # Install nvm:
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Restart terminal or reload:
   source ~/.zshrc
   
   # Install latest LTS Node.js:
   nvm install --lts
   nvm use --lts
   ```

   **Option C: Download from official website**
   - Visit https://nodejs.org/ and download the LTS version

3. **Install NestJS CLI:**
   ```bash
   npm install -g @nestjs/cli
   ```

4. **Verify everything is installed:**
   ```bash
   ./setup.sh
   ```

5. **Create your NestJS project:**
   ```bash
   # Create a new project in a subdirectory:
   nest new my-project
   
   # Or initialize in the current directory:
   nest new . --skip-git
   ```

## What You Need

- ✅ **Node.js** (v18 or higher recommended)
- ✅ **npm** (comes with Node.js)
- ✅ **NestJS CLI** (install globally with `npm install -g @nestjs/cli`)

## Files in This Directory

- `setup.sh` - Script to check if all prerequisites are installed
- `SETUP.md` - Detailed setup instructions
- `README.md` - This file

## Need Help?

Run `./setup.sh` anytime to check your setup status and get installation instructions.
