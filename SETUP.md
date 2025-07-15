# Cross-Platform Setup Guide

This guide ensures the IoTFlow Dashboard works consistently across different operating systems and development environments.

## Prerequisites

### Required Software
- **Node.js**: Version 16.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: Latest version

### Recommended Software
- **VS Code**: For optimal development experience
- **Chrome/Firefox**: For testing and debugging

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Dashboard_IoTFlow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the project root:
```env
# React App Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001

# Optional: For production builds
# REACT_APP_API_URL=https://your-production-api.com
# REACT_APP_WS_URL=wss://your-production-api.com
```

### 4. Start Development Server
```bash
npm start
```

## Cross-Platform Considerations

### Windows
- Ensure Windows Subsystem for Linux (WSL) is available for better compatibility
- Use PowerShell or Command Prompt as administrator if needed
- Git line ending configuration:
  ```bash
  git config --global core.autocrlf true
  ```

### macOS
- Install Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```
- Use Homebrew for package management if needed

### Linux
- Ensure build essentials are installed:
  ```bash
  sudo apt-get install build-essential
  ```

## Common Issues and Solutions

### Port Already in Use
If port 3000 is already in use:
```bash
# Kill process using port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm start
```

### Permission Issues (Linux/macOS)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Node Version Issues
Use Node Version Manager (nvm):
```bash
# Install specific Node version
nvm install 18
nvm use 18
```

### Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables

### Development (.env.local)
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_DEBUG=true
```

### Production (.env.production)
```env
REACT_APP_API_URL=https://api.iotflow.com
REACT_APP_WS_URL=wss://api.iotflow.com
REACT_APP_DEBUG=false
```

## Build and Deployment

### Development Build
```bash
npm start
```

### Production Build
```bash
npm run build
```

### Testing Build Locally
```bash
npm install -g serve
serve -s build
```

## IDE Configuration

### VS Code Settings (Optional)
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer
- Material Icon Theme

## Git Configuration

### Line Endings
```bash
# Windows
git config --global core.autocrlf true

# macOS/Linux
git config --global core.autocrlf input
```

### Ignore IDE Files
The `.gitignore` is configured to ignore:
- IDE-specific files (.vscode/, .idea/)
- OS-specific files (.DS_Store, Thumbs.db)
- Build artifacts
- Environment files
- Dependency directories

## Troubleshooting

### Build Fails
1. Check Node.js version: `node --version`
2. Clear cache: `npm cache clean --force`
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Check for syntax errors in recent changes

### Development Server Won't Start
1. Check if port 3000 is available
2. Verify environment variables
3. Check for conflicting processes
4. Try restarting in safe mode: `npm start --reset-cache`

### Hot Reload Not Working
1. Check if you're using a supported browser
2. Verify file watching permissions
3. Try restarting the development server
4. Check for antivirus software blocking file changes

## Performance Optimization

### Development
- Use React Developer Tools browser extension
- Enable source maps for debugging
- Use lazy loading for large components

### Production
- Optimize bundle size with webpack-bundle-analyzer
- Enable compression (gzip/brotli)
- Use CDN for static assets
- Implement proper caching strategies

## Security Considerations

- Never commit `.env` files with sensitive data
- Use environment variables for API keys
- Validate all user inputs
- Keep dependencies updated
- Use HTTPS in production

## Team Development

### Code Style
- Use Prettier for code formatting
- Follow ESLint rules
- Use conventional commit messages
- Review code before merging

### Collaboration
- Keep `.gitignore` updated
- Document environment variable requirements
- Maintain this setup guide
- Use consistent Node.js versions across team

This setup ensures the project works consistently across different development environments and operating systems.
