# Ultimate Mine Bot 🤖

An educational automation bot for mine-field style games with advanced analysis capabilities.

## ⚠️ IMPORTANT DISCLAIMER

**This software is for EDUCATIONAL PURPOSES ONLY.**

- Using automation bots on gambling sites may violate terms of service
- Could be illegal in your jurisdiction  
- May result in account bans or legal consequences
- Use at your own risk and ensure compliance with local laws

## Features

🎯 **Automated Gameplay**
- Intelligent move analysis using probability calculations
- Safe cell detection and mine flagging
- Multiple strategy algorithms

💡 **Console Utilities** 
- Real-time probability analysis
- Advanced cheat mode capabilities
- Manual control commands

🔧 **Flexible Configuration**
- Customizable login credentials
- Adjustable delays and strategies
- Headless or visible browser mode

## Installation

1. Clone the repository:
```bash
git clone https://github.com/levi955/ultimate-mine-bot.git
cd ultimate-mine-bot
```

2. Install dependencies:
```bash
npm install
```

3. Install browser (if needed):
```bash
npm run install-browsers
```

4. Configure your settings:
```bash
cp .env.example .env
# Edit .env with your credentials
```

## Usage

### Basic Usage

```bash
npm start
```

### Manual Console Control

When the bot is running, open your browser's developer console and use these commands:

```javascript
// Quick commands
bot.analyzeProbabilities()  // Show probability analysis
bot.autoFlag()             // Auto-flag obvious mines  
bot.revealSafe()           // Reveal obviously safe cells
bot.getGameState()         // Show current game state

// Advanced (CHEAT MODE)
bot.revealSafeCells()      // Reveal ALL safe cells

// Shortcuts
analyze()  // Same as bot.analyzeProbabilities()
flag()     // Same as bot.autoFlag() 
reveal()   // Same as bot.revealSafe()
cheat()    // Same as bot.revealSafeCells()
```

### Configuration

Edit `.env` file:

```bash
USERNAME=prevelme12
PASSWORD=your_password_here
SITE_URL=https://bandit.camp/mines
HEADLESS=false
DELAY_MS=1000
```

## How It Works

### 1. Login Automation
- Automatically detects login forms
- Fills credentials and submits
- Fallback to manual login if needed

### 2. Game Detection
- Searches for mine game elements
- Analyzes board structure
- Identifies clickable cells

### 3. Strategy Engine
- **Safe Move Detection**: Finds guaranteed safe moves
- **Probability Analysis**: Calculates mine probabilities for each cell
- **Pattern Recognition**: Uses minesweeper logic rules

### 4. Console Interface
- Injects powerful utilities into browser console
- Real-time analysis and control
- Advanced cheat capabilities

## Example Console Output

```
🤖 Ultimate Mine Bot v1.0
⚠️  Educational use only - Use at your own risk

🚀 Starting bot...
🌐 Launching browser...
📍 Navigating to https://bandit.camp/mines...
🔑 Attempting login...
✅ Found username input: input[name="username"]
✅ Found password input: input[type="password"]
📝 Filled credentials for user: prevelme12
🔄 Submitted login form
✅ Login attempt completed
🔍 Searching for minefield game...
🎮 Found game element: .mine-grid
✅ Game area located
💉 Injecting console utilities...
✅ Console utilities injected
💡 Open browser console and type "bot" for available commands
🎯 Analyzing game board...
📊 Board dimensions: 10x10
💣 Estimated mines: 15
🎲 Move 1
🎯 Making move at (5, 5)
```

## Advanced Features

### Probability Analysis
The bot calculates mine probabilities using:
- Neighbor constraint analysis
- Bayesian probability updates
- Pattern matching algorithms

### Cheat Mode
Console command `bot.revealSafeCells()` will:
- Identify all non-mine cells
- Automatically click safe cells
- Bypass game logic entirely

### Strategy Modes
1. **Conservative**: Only makes 100% safe moves
2. **Probability**: Uses mathematical analysis 
3. **Aggressive**: Takes calculated risks

## Code Structure

```
├── index.js              # Main entry point
├── src/
│   ├── MineBot.js        # Core bot logic
│   ├── GameAnalyzer.js   # Game analysis algorithms  
│   └── ConsoleInjector.js # Browser console utilities
├── .env.example          # Configuration template
└── package.json          # Project dependencies
```

## Legal and Ethical Considerations

**Please be aware:**

1. **Terms of Service**: Most gambling sites prohibit automation
2. **Legal Issues**: Automated gambling may be illegal in your area
3. **Account Risks**: Your account may be banned
4. **Responsible Use**: This is educational software only

**Recommended Use:**
- Learning web automation techniques
- Understanding game algorithms
- Educational minesweeper analysis
- Testing on local/offline games only

## Contributing

This is an educational project. Feel free to:
- Improve algorithms
- Add new analysis features  
- Enhance detection methods
- Fix bugs and issues

## License

ISC License - Educational use only

---

**Remember: Use responsibly and ethically! 🎓**
