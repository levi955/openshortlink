# Deployment and Usage Guide

## 🚀 Quick Start Deployment

### Option 1: Automated Installation
```bash
chmod +x install.sh
./install.sh
```

### Option 2: Manual Installation
```bash
# Install dependencies
pip3 install -r requirements.txt

# Install browser
python3 -m playwright install chromium

# Configure
cp .env.example .env
# Edit .env with your settings

# Test
python3 test_bot.py

# Run
python3 main.py
```

## 🎯 Usage Examples

### Basic Usage
```bash
# Run with default settings
python3 main.py

# Run 10 games only
python3 main.py --max-games 10

# Run in background (headless)
python3 main.py --headless
```

### Advanced Configuration
```bash
# Custom configuration file
python3 main.py --config production.env

# Dry run for testing
python3 main.py --dry-run --max-games 5
```

## ⚙️ Configuration Tips

### Conservative Setup (Recommended for beginners)
```env
DEFAULT_BET_AMOUNT=0.001
STOP_LOSS=1.0
TAKE_PROFIT=5.0
CONSERVATIVE_MODE=True
AUTO_CASHOUT_AFTER=2
```

### Aggressive Setup (Higher risk/reward)
```env
DEFAULT_BET_AMOUNT=0.01
STOP_LOSS=10.0
TAKE_PROFIT=50.0
CONSERVATIVE_MODE=False
AUTO_CASHOUT_AFTER=4
```

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **"Browser not installed" error**
   ```bash
   python3 -m playwright install chromium
   ```

2. **Site access blocked**
   - Try running with VPN
   - Use different browser user agent
   - Check if site is accessible manually

3. **Login failures**
   - Verify credentials in .env
   - Check if 2FA is enabled
   - Ensure account is not locked

4. **Selector errors (elements not found)**
   - Site HTML may have changed
   - Update selectors in web_driver.py
   - Run in non-headless mode to inspect page

### Debugging
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python3 main.py

# Check logs
tail -f mine_bot.log
```

## 📊 Monitoring Performance

### Key Metrics to Watch
- Win rate (aim for >60%)
- Average profit per game
- Risk-adjusted returns
- Time to stop-loss/take-profit

### Performance Optimization
1. Adjust `AUTO_CASHOUT_AFTER` based on results
2. Fine-tune `CLICK_DELAY` for optimal speed
3. Monitor win rates and adjust strategy
4. Set appropriate risk limits

## 🛡️ Safety Guidelines

### Risk Management
- Never bet more than you can afford to lose
- Always use stop-loss limits
- Monitor bot performance regularly
- Take breaks and avoid emotional decisions

### Security
- Keep credentials secure
- Use strong passwords
- Monitor account activity
- Log out after sessions

### Legal Compliance
- Check local gambling laws
- Ensure automated trading is allowed
- Use only on permitted platforms
- Comply with site terms of service

## 🎯 Strategy Optimization

### Fine-tuning Parameters
```python
# In strategy.py, you can adjust:
- Mine probability thresholds
- Expected value calculations
- Conservative vs aggressive square selection
- Cashout timing logic
```

### Custom Strategies
The bot is designed to be extensible. You can:
1. Modify `strategy.py` for custom logic
2. Add new risk management rules
3. Implement machine learning models
4. Create custom betting progressions

## 📈 Production Deployment

### Server Setup
```bash
# Install in virtual environment
python3 -m venv mine_bot_env
source mine_bot_env/bin/activate
pip install -r requirements.txt

# Setup systemd service (Linux)
sudo cp mine_bot.service /etc/systemd/system/
sudo systemctl enable mine_bot
sudo systemctl start mine_bot
```

### Monitoring
- Setup log rotation
- Monitor system resources
- Track profit/loss trends
- Set up alerts for errors

### Backup
- Backup configuration files
- Save trading logs
- Keep performance records
- Document strategy changes

---

**Remember**: This bot is for educational purposes. Gambling involves risk and you may lose money. Use responsibly!