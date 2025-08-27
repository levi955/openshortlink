# Ultimate Mine Bot 🎯

An advanced automated bot for playing mines games on bandit.camp with intelligent strategy and risk management.

## ⚠️ Disclaimer

**This bot is for educational purposes only.** Gambling involves financial risk, and you could lose money. Use this bot responsibly and never gamble more than you can afford to lose. The developers are not responsible for any financial losses.

## 🌟 Features

- **Intelligent Strategy**: Uses probability-based decision making
- **Risk Management**: Built-in stop-loss and take-profit limits
- **Conservative Mode**: Prefers safer corner/edge squares
- **Customizable Settings**: Fully configurable via environment variables
- **Real-time Monitoring**: Live statistics and profit tracking
- **Web Automation**: Seamless browser automation with Playwright
- **Logging**: Comprehensive logging for analysis and debugging

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/levi955/ultimate-mine-bot.git
   cd ultimate-mine-bot
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Playwright browsers:**
   ```bash
   playwright install chromium
   ```

4. **Configure the bot:**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

### Basic Usage

Run the bot with default settings:
```bash
python main.py
```

Run in headless mode (no browser window):
```bash
python main.py --headless
```

Limit to 10 games:
```bash
python main.py --max-games 10
```

## ⚙️ Configuration

The bot is configured through environment variables in the `.env` file:

### Basic Settings
- `DEFAULT_BET_AMOUNT`: Starting bet amount (default: 0.01)
- `MINE_COUNT`: Number of mines in the game (default: 3)
- `GRID_SIZE`: Total grid squares (default: 25 for 5x5)

### Risk Management
- `STOP_LOSS`: Stop if losses exceed this amount (default: 10.0)
- `TAKE_PROFIT`: Stop if profits exceed this amount (default: 50.0)
- `MAX_BET_AMOUNT`: Maximum bet per game (default: 1.0)
- `MIN_BET_AMOUNT`: Minimum bet per game (default: 0.001)

### Strategy
- `CONSERVATIVE_MODE`: Use safer corner/edge strategy (default: True)
- `AUTO_CASHOUT_AFTER`: Auto cashout after N safe squares (default: 3)

### Automation
- `CLICK_DELAY`: Delay between clicks in seconds (default: 1.0)
- `USERNAME`: Account username (if required)
- `PASSWORD`: Account password (if required)

## 🧠 Strategy

The bot implements several strategic approaches:

### Conservative Mode
- Prioritizes corner squares on first click (statistically safer)
- Falls back to edge squares if corners unavailable
- Uses probability calculations for subsequent moves

### Risk Assessment
- Calculates mine probability for each square
- Automatically cashes out when risk exceeds reward
- Stops at configurable profit/loss thresholds

### Betting Strategy
- Starts with conservative bet amounts
- Slightly increases bets after wins
- Reduces bets after losses to preserve capital

## 📊 Statistics

The bot tracks comprehensive statistics:
- Games played, won, and lost
- Win rate percentage
- Total profit/loss
- Return on investment (ROI)
- Real-time balance monitoring

## 🛠️ Advanced Usage

### Custom Configuration File
```bash
python main.py --config custom_config.env
```

### Dry Run Mode (Simulation)
```bash
python main.py --dry-run
```

### Debug Mode
Set `LOG_LEVEL=DEBUG` in your `.env` file for detailed logging.

## 📁 Project Structure

```
ultimate-mine-bot/
├── main.py              # Main entry point
├── mine_bot.py          # Core bot logic
├── web_driver.py        # Web automation
├── strategy.py          # Game strategy and algorithms
├── config.py            # Configuration management
├── requirements.txt     # Python dependencies
├── .env.example         # Example configuration
└── README.md           # This file
```

## 🔧 Development

### Running Tests
```bash
python -m pytest tests/
```

### Code Style
The project follows PEP 8 style guidelines. Format code with:
```bash
black *.py
```

## 🐛 Troubleshooting

### Common Issues

1. **Browser fails to start**
   - Install Playwright browsers: `playwright install chromium`
   - Try running in headless mode: `--headless`

2. **Login fails**
   - Verify USERNAME and PASSWORD in .env
   - Check if 2FA is enabled on your account

3. **Site selectors not working**
   - The site may have updated their HTML structure
   - Update selectors in `web_driver.py`

4. **Bot stops immediately**
   - Check your STOP_LOSS and TAKE_PROFIT settings
   - Verify sufficient account balance

### Logging

Check the log file (`mine_bot.log`) for detailed error information:
```bash
tail -f mine_bot.log
```

## 📈 Performance Tips

1. **Optimize delays**: Reduce `CLICK_DELAY` but not too low to avoid detection
2. **Conservative settings**: Start with small bet amounts and conservative cashout
3. **Monitor performance**: Regularly check win rates and adjust strategy
4. **Risk management**: Never disable stop-loss protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## ⚖️ Legal Notice

This software is provided for educational purposes only. Users are responsible for complying with all applicable laws and regulations regarding automated trading and gambling in their jurisdiction. The authors assume no responsibility for any misuse of this software.

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the logs for error details

---

**Remember**: Only gamble what you can afford to lose! 🎰
