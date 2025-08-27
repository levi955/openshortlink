# Ultimate Mine Bot

An advanced automated bot for playing minesweeper games on bandit.camp/mines. This bot uses sophisticated AI strategies, web automation, and optional "cheating" techniques to maximize win rates.

## Features

- 🤖 **Automated Gameplay**: Full automation of minesweeper gameplay with intelligent move selection
- 🧠 **AI Strategy Engine**: Multiple solving algorithms including probability analysis and pattern recognition
- 🔐 **Automatic Login**: Handles authentication and session management
- 📊 **Learning System**: Improves performance over time through statistical analysis
- 🎯 **Advanced Cheating**: Optional DOM inspection, timing attacks, and memory analysis
- 📈 **Statistics Tracking**: Comprehensive performance metrics and game data logging
- 🖥️ **CLI Interface**: Easy-to-use command line interface with setup wizard

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/levi955/ultimate-mine-bot.git
   cd ultimate-mine-bot
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Setup configuration:**
   ```bash
   python cli.py --setup
   ```
   
   Or manually copy `.env.example` to `.env` and edit with your credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your bandit.camp username and password
   ```

## Quick Start

1. **Run the setup wizard:**
   ```bash
   python cli.py --setup
   ```

2. **Test your configuration:**
   ```bash
   python cli.py --test
   ```

3. **Start the bot:**
   ```bash
   python cli.py --run
   ```

## Usage

### Command Line Interface

The bot includes a comprehensive CLI for easy operation:

```bash
# Basic usage
python cli.py --run                     # Run with default settings
python cli.py --run --headless         # Run in headless mode (no browser window)
python cli.py --run --games 5          # Play maximum 5 games
python cli.py --run --delay 0.5        # 0.5 second delay between moves
python cli.py --run --cheats           # Enable advanced cheating strategies

# Utility commands
python cli.py --setup                  # Interactive setup wizard
python cli.py --test                   # Test configuration
python cli.py --stats                  # Show session statistics
python cli.py --clean                  # Clean up temporary files
```

### Direct Python Usage

```python
from main import UltimateMineBot

# Create and run bot
bot = UltimateMineBot()
bot.run()
```

## Configuration

All settings are managed through the `.env` file:

```env
# Account Credentials
BANDIT_USERNAME=your_username
BANDIT_PASSWORD=your_password

# Bot Settings
HEADLESS_MODE=False          # Run browser in background
GAME_DELAY=1.0              # Seconds between moves
MAX_GAMES_PER_SESSION=10    # Maximum games per run
LEARNING_RATE=0.01          # AI learning rate

# Advanced Features
ENABLE_CHEATS=False         # Enable cheating strategies
ENABLE_STATISTICS=True      # Track performance stats
SAVE_GAME_DATA=True        # Save game data for analysis
```

## Bot Strategy

The bot employs multiple sophisticated strategies:

### 1. **Logical Solving**
- Number constraint analysis
- Safe move identification
- Mine flagging based on number constraints
- Pattern recognition for common minesweeper scenarios

### 2. **Probability Analysis**
- Calculates mine probability for each unrevealed tile
- Uses local and global mine density estimates
- Selects moves with lowest mine probability

### 3. **Learning System**
- Tracks successful move patterns
- Builds statistical models of game behavior
- Adapts strategy based on historical performance

### 4. **Advanced Cheating (Optional)**
- **DOM Inspection**: Scans for exposed game state in HTML/JavaScript
- **Network Analysis**: Monitors API calls for game data leaks
- **Timing Attacks**: Analyzes server response times for hints
- **Memory Scanning**: Searches browser memory for game state
- **CSS Analysis**: Looks for hidden styling that reveals mine locations

## File Structure

```
ultimate-mine-bot/
├── main.py              # Main bot controller
├── config.py            # Configuration management
├── web_driver.py        # Browser automation
├── game_logic.py        # Game detection and interaction
├── strategy.py          # AI strategy engine
├── cheat_engine.py      # Advanced cheating techniques
├── cli.py               # Command line interface
├── requirements.txt     # Python dependencies
├── .env.example        # Configuration template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Generated Directories

During operation, the bot creates several directories:

- `logs/` - Bot operation logs
- `screenshots/` - Game screenshots for debugging
- `game_data/` - Session statistics and learning data
- `cheat_analysis/` - Results from cheating analysis (if enabled)

## Performance Monitoring

The bot tracks comprehensive statistics:

- **Win Rate**: Percentage of games won
- **Move Success Rate**: Percentage of moves that don't hit mines
- **Games per Session**: Number of games played
- **Learning Progress**: Improvement over time

View statistics with:
```bash
python cli.py --stats
```

## Troubleshooting

### Common Issues

1. **Login Fails**
   - Verify credentials in `.env` file
   - Check if bandit.camp is accessible
   - Ensure no CAPTCHA or 2FA is required

2. **Game Board Not Detected**
   - Site layout may have changed
   - Check browser console for JavaScript errors
   - Try running in non-headless mode for debugging

3. **Bot Moves Too Fast/Slow**
   - Adjust `GAME_DELAY` in `.env`
   - Some sites have rate limiting

4. **Browser Crashes**
   - Update Chrome browser
   - Check available memory
   - Try running fewer concurrent games

### Debug Mode

Run with screenshots and detailed logging:
```bash
python cli.py --run --delay 2.0  # Slower for debugging
```

Check logs in the `logs/` directory for detailed error information.

## Legal and Ethical Considerations

⚠️ **Important Notice**: This bot is for educational purposes only. Using automated tools may violate the terms of service of gambling sites. Users are responsible for ensuring compliance with all applicable laws and website terms. The "cheating" features are included for educational demonstration of web security concepts.

**Recommendations**:
- Only use on sites that explicitly allow automation
- Respect rate limits and don't overload servers
- Use responsibly and ethically
- Consider the educational value over financial gain

## Contributing

Contributions are welcome! Please consider:

- Improving strategy algorithms
- Adding support for other minesweeper sites
- Enhancing cheat detection methods
- Better error handling and recovery
- Performance optimizations

## License

This project is for educational purposes. Please use responsibly and in accordance with applicable laws and website terms of service.

## Disclaimer

This software is provided for educational and research purposes only. The authors are not responsible for any misuse or legal issues arising from the use of this software. Users must ensure compliance with all applicable laws and website terms of service.
