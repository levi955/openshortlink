# Ultimate Mine Bot - Detailed Setup Guide

This guide provides comprehensive instructions for setting up and configuring the Ultimate Mine Bot.

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: Windows 10, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 14.0.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 1GB free space
- **Internet**: Stable broadband connection

### Recommended Requirements
- **CPU**: Multi-core processor (4+ cores recommended)
- **RAM**: 8GB or more
- **Browser**: Chrome/Chromium latest version
- **Network**: Low-latency connection (<100ms to target site)

## 🔧 Installation Steps

### Step 1: Install Node.js

#### Windows
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

#### macOS
```bash
# Using Homebrew (recommended)
brew install node

# Or download from nodejs.org
```

#### Linux (Ubuntu/Debian)
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Clone Repository

```bash
# Clone the repository
git clone https://github.com/levi955/ultimate-mine-bot.git

# Navigate to directory
cd ultimate-mine-bot

# Verify files
ls -la
```

### Step 3: Install Dependencies

```bash
# Install all required packages
npm install

# This will install:
# - puppeteer (browser automation)
# - dotenv (environment configuration)
# - chalk (colored console output)
# - inquirer (interactive prompts)
```

### Step 4: Configure Environment

```bash
# Copy example configuration
cp .env.example .env

# Edit configuration file
nano .env  # or use your preferred editor
```

## ⚙️ Configuration Guide

### Basic Configuration

Edit the `.env` file with your specific settings:

```bash
# Essential Settings
SITE_URL=https://your-mining-site.com
USERNAME=your_username_here
PASSWORD=your_secure_password

# Basic Bot Behavior
HEADLESS=true
AUTO_PLAY=false
MAX_GAMES=10
```

### Advanced Configuration

#### Timing Settings
```bash
# Control bot speed and detection avoidance
DELAY_MIN=1000          # Minimum delay between actions (ms)
DELAY_MAX=3000          # Maximum delay between actions (ms)
CLICK_DELAY=200         # Delay after each click (ms)
ANALYSIS_DELAY=500      # Time for game state analysis (ms)
```

#### Safety Features
```bash
# Risk management
STOP_ON_LOSS=true       # Stop after losing streak
MAX_LOSS_STREAK=3       # Maximum consecutive losses
TAKE_SCREENSHOT=true    # Capture game screenshots
CONSERVATIVE_MODE=true   # Use safe strategy
```

#### Debug Options
```bash
# Development and troubleshooting
DEBUG=false             # Enable debug mode
VERBOSE_LOGGING=false   # Detailed console output
SAVE_LOGS=true          # Save logs to file
HEADLESS=false          # Show browser window (debug only)
```

#### Browser Settings
```bash
# Browser customization
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
VIEWPORT_WIDTH=1366     # Browser window width
VIEWPORT_HEIGHT=768     # Browser window height
```

### Game-Specific Configuration

Create a `config/games.json` file for game-specific settings:

```json
{
  "default": {
    "gridSize": 5,
    "mineCount": 3,
    "strategy": "conservative"
  },
  "advanced": {
    "gridSize": 8,
    "mineCount": 10,
    "strategy": "aggressive",
    "timeLimit": 120
  }
}
```

## 🎯 Site-Specific Setup

### Generic Mining Games

For most web-based mining games:

1. **Identify Game Elements**:
   ```javascript
   // Common selectors to look for:
   const gameSelectors = [
       '.game-board',      // Game container
       '.cell',            // Individual cells
       '.mine',            // Mine indicators
       '.number'           // Number cells
   ];
   ```

2. **Test Game Detection**:
   ```bash
   # Run in debug mode
   DEBUG=true HEADLESS=false npm start
   ```

3. **Customize Selectors** (if needed):
   Edit `src/bot.js` and update the selector arrays.

### Popular Gaming Sites

#### Site A Configuration
```bash
SITE_URL=https://site-a.com/mine-game
# Additional site-specific settings
GAME_SELECTOR=.game-container
CELL_SELECTOR=.cell
START_BUTTON=.start-game
```

#### Site B Configuration
```bash
SITE_URL=https://site-b.com/mining
# Canvas-based game
GAME_TYPE=canvas
CANVAS_SELECTOR=#game-canvas
```

## 🧪 Testing Your Setup

### Basic Functionality Test

```bash
# Test configuration
npm run test-config

# Test browser launch
npm run test-browser

# Test site connectivity
npm run test-site
```

### Manual Testing

1. **Start in Debug Mode**:
   ```bash
   DEBUG=true HEADLESS=false npm start
   ```

2. **Verify Each Step**:
   - Browser launches correctly
   - Site loads properly
   - Login works (if applicable)
   - Game detection succeeds
   - Bot can interact with game elements

3. **Check Screenshots**:
   Screenshots are saved in `screenshots/` directory for review.

## 🔍 Troubleshooting

### Common Issues and Solutions

#### Issue: "Browser failed to launch"
**Solutions**:
```bash
# Install Chrome dependencies (Linux)
sudo apt-get update
sudo apt-get install -y chromium-browser

# Fix permissions
sudo chmod +x node_modules/puppeteer/.local-chromium/*/chrome-linux/chrome

# Try different launch options
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser npm start
```

#### Issue: "Site not loading"
**Solutions**:
1. Check internet connection
2. Verify SITE_URL is correct
3. Test site manually in browser
4. Check for VPN/proxy issues

#### Issue: "Game elements not found"
**Solutions**:
1. Enable debug mode to see page structure
2. Update selectors in `src/bot.js`
3. Check if site has updated their interface
4. Verify game is actually loaded

#### Issue: "Login fails"
**Solutions**:
1. Verify username/password are correct
2. Check for CAPTCHA or 2FA requirements
3. Update login selectors if site changed
4. Try manual login first to test credentials

### Debug Commands

```bash
# Full debug session
DEBUG=true VERBOSE_LOGGING=true HEADLESS=false npm start

# Test specific components
node -e "require('./src/config').Config.prototype.validate()"
node -e "require('./src/utils').Logger.prototype.info('Test')"

# Check Puppeteer installation
node -e "console.log(require('puppeteer').executablePath())"
```

## 📊 Performance Optimization

### Hardware Optimization

1. **RAM Usage**:
   ```bash
   # Monitor memory usage
   htop  # Linux/Mac
   # Task Manager (Windows)
   
   # Optimize for low memory
   HEADLESS=true
   VIEWPORT_WIDTH=800
   VIEWPORT_HEIGHT=600
   ```

2. **CPU Usage**:
   ```bash
   # Reduce CPU load
   DELAY_MIN=2000
   DELAY_MAX=5000
   MAX_GAMES=5
   ```

### Network Optimization

```bash
# Optimize for slow connections
DELAY_MIN=3000
DELAY_MAX=6000
ANALYSIS_DELAY=1000

# Reduce screenshot frequency
TAKE_SCREENSHOT=false
DEBUG=false
```

### Strategy Optimization

```bash
# For maximum win rate
CONSERVATIVE_MODE=true
PROBABILITY_THRESHOLD=0.8
PATTERN_LEARNING=true

# For speed
CONSERVATIVE_MODE=false
PROBABILITY_THRESHOLD=0.6
CLICK_DELAY=100
```

## 🔐 Security Considerations

### Account Safety

1. **Use Dedicated Accounts**: Never use main/primary accounts
2. **Strong Passwords**: Use unique, strong passwords
3. **Monitor Activity**: Check for unusual account activity
4. **Backup Settings**: Keep configuration backups

### Detection Avoidance

```bash
# Human-like behavior
DELAY_MIN=1500
DELAY_MAX=4000
TAKE_SCREENSHOT=true
PATTERN_LEARNING=true

# Session management
MAX_GAMES=15
STOP_ON_LOSS=true
```

### Privacy Protection

```bash
# Minimize data collection
SAVE_LOGS=false
VERBOSE_LOGGING=false
TAKE_SCREENSHOT=false

# Use VPN if needed
# Configure proxy settings if required
```

## 📈 Monitoring and Maintenance

### Log Monitoring

```bash
# Monitor real-time logs
tail -f bot.log

# Search for errors
grep "ERROR" bot.log

# Analyze performance
grep "Stats:" bot.log | tail -20
```

### Regular Maintenance

1. **Update Dependencies**:
   ```bash
   npm update
   npm audit fix
   ```

2. **Clean Up Files**:
   ```bash
   # Remove old screenshots
   find screenshots/ -name "*.png" -mtime +7 -delete
   
   # Rotate log files
   mv bot.log bot.log.old
   ```

3. **Performance Review**:
   - Check win rates weekly
   - Adjust strategy based on results
   - Update selectors if games change

## 📞 Getting Help

### Documentation Resources
- **Main README**: Basic usage and features
- **Code Comments**: Inline documentation in source files
- **Examples**: Working examples in `examples/` directory

### Community Support
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Share strategies and configurations

### Professional Support
For commercial use or advanced customization, consider:
- Custom game integration
- Performance optimization
- Advanced strategy development
- Dedicated support channels

---

**Remember**: Always comply with website terms of service and applicable laws when using automation tools.