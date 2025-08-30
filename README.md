# NASDAQ 100 Futures Trading Bot 🤖📈

**Advanced intraday trading bot for NASDAQ 100 futures with news integration, confluence analysis, and machine learning capabilities.**

## 🌟 Key Features

### 🎯 NASDAQ 100 Futures Trading
- **Intraday Trading**: Sophisticated strategies for day trading NASDAQ 100 futures (NQ)
- **One Trade Per Day**: Risk-managed approach with maximum one trade per trading session
- **Real-time Market Data**: Live price feeds and technical analysis
- **Position Sizing**: Intelligent position sizing based on account balance and risk parameters

### 📰 Forex Factory News Integration
- **Economic Calendar**: Real-time news feed from Forex Factory
- **Red Folder Filtering**: Automatically avoids high-impact news events
- **News Sentiment Analysis**: Analyzes economic data for market sentiment
- **Trading Safety**: Prevents trading during major economic releases

### 📊 ES Confluence Analysis
- **E-mini S&P 500 Correlation**: Uses ES futures for market confluence
- **Trend Alignment**: Ensures both NQ and ES are aligned before trading
- **Technical Indicators**: RSI, Moving Averages, and custom algorithms
- **Multi-timeframe Analysis**: Comprehensive market structure analysis

### 🧠 Machine Learning & Adaptation
- **Trade Learning**: Analyzes each trade outcome to improve future decisions
- **Pattern Recognition**: Identifies successful trading patterns over time
- **Performance Metrics**: Tracks win rate, profit factor, and consecutive streaks
- **Adaptive Strategies**: Adjusts trading parameters based on historical performance

### 📈 Comprehensive Outcome Reporting
- **Real-time P&L**: Live profit and loss tracking
- **Trade Analytics**: Detailed analysis of each trade execution
- **Learning Insights**: Shows what the bot learned from each trade
- **Session Summaries**: Daily and weekly performance reports

## 🚀 Quick Start

### Prerequisites
- Node.js 14.0.0 or higher
- Trading account with NASDAQ 100 futures access
- Basic understanding of futures trading

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/levi955/ultimate-mine-bot.git
   cd ultimate-mine-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure for trading**
   ```bash
   cp .env.example .env
   # Edit .env with your trading parameters
   ```

   **Required Configuration:**
   ```bash
   # Account Settings
   ACCOUNT_BALANCE=100000
   RISK_PERCENT=1.0
   MAX_POSITION_SIZE=5
   
   # Trading Rules
   MAX_TRADES_PER_DAY=1
   STOP_LOSS_PERCENT=0.5
   TAKE_PROFIT_PERCENT=1.0
   MIN_SETUP_SCORE=5
   
   # News Filtering
   FILTER_RED_FOLDER_NEWS=true
   NEWS_IMPACT_THRESHOLD=medium
   ```

4. **Run the trading bot**
   ```bash
   npm start
   ```

## ⚙️ Trading Configuration

### Essential Settings

```bash
# Trading Configuration
TRADING_MODE=futures
SYMBOL=NQ
CONFLUENCE_SYMBOL=ES

# Risk Management
ACCOUNT_BALANCE=100000
RISK_PERCENT=1.0
MAX_POSITION_SIZE=5
STOP_LOSS_PERCENT=0.5
TAKE_PROFIT_PERCENT=1.0

# Trading Rules
MAX_TRADES_PER_DAY=1
MIN_SETUP_SCORE=5

# News Integration
FILTER_RED_FOLDER_NEWS=true
NEWS_UPDATE_INTERVAL=300000

# Learning System
ENABLE_LEARNING=true
PATTERN_LEARNING=true
MEMORY_SIZE=1000
```

### Trading Hours

The bot automatically operates during market hours:
- **Regular Hours**: 9:30 AM - 4:00 PM EST
- **Pre-market**: Optional (configure via environment)
- **After-hours**: Optional (configure via environment)

## 🎮 Usage

### Basic Usage

```javascript
const { TradingBot } = require('./src/trading-bot');
const { Config } = require('./src/config');
const { Logger } = require('./src/utils');

const config = new Config();
const logger = new Logger();
const bot = new TradingBot(config, logger);

await bot.start();
```

### Advanced Configuration

```javascript
// Custom risk management
const config = new Config();
config.set('RISK_PERCENT', 0.5); // Conservative 0.5% risk
config.set('MIN_SETUP_SCORE', 7); // High confidence trades only
config.set('STOP_LOSS_PERCENT', 0.3); // Tight stop loss

const bot = new TradingBot(config, logger);
await bot.start();
```

## 🏗️ Architecture

```
nasdaq-100-trading-bot/
├── index.js                    # Main entry point
├── src/
│   ├── trading-bot.js         # Main trading bot logic
│   ├── market-data.js         # NASDAQ & ES market data service
│   ├── news-service.js        # Forex Factory news integration
│   ├── trading-strategy.js    # Trading algorithms and ML
│   ├── config.js              # Configuration management
│   └── utils.js               # Utilities and logging
├── docs/                      # Documentation
└── examples/                  # Usage examples
```

## 🧮 Trading Algorithms

### Market Analysis
- **Confluence Detection**: Analyzes alignment between NQ and ES
- **Technical Indicators**: RSI, Moving Averages, Volume analysis
- **News Correlation**: Filters trades based on economic events
- **Risk Assessment**: Calculates optimal position sizes

### Learning System
- **Trade Outcome Analysis**: Studies what made trades successful/unsuccessful
- **Pattern Recognition**: Identifies recurring profitable setups
- **Performance Metrics**: Tracks and improves win rate over time
- **Adaptive Parameters**: Adjusts trading rules based on market conditions

### News Integration
- **Economic Calendar**: Real-time Forex Factory data
- **Impact Filtering**: Avoids trading during high-impact news
- **Sentiment Analysis**: Gauges market sentiment from economic data
- **Safety Protocols**: Prevents trading during volatile periods

## 📈 Performance Features

### Trade Execution
- **One Trade Per Day**: Risk-managed approach
- **Confluence Required**: Both NQ and ES must align
- **News Safety Check**: Ensures no conflicting economic events
- **Learning Integration**: Uses historical data to improve decisions

### Outcome Reporting
- **Real-time P&L**: Live profit/loss tracking
- **Trade Analysis**: Detailed breakdown of each trade
- **Learning Insights**: Shows adaptation from each outcome
- **Performance Metrics**: Win rate, profit factor, streaks

### Machine Learning
- **Pattern Memory**: Stores successful trading patterns
- **Setup Scoring**: Rates trade setups based on historical success
- **Adaptive Risk**: Adjusts position sizing based on confidence
- **Continuous Improvement**: Gets better with each trade

## 🛡️ Risk Management

### Position Sizing
- **Percentage-based Risk**: Risk only 1% of account per trade
- **Maximum Position Limits**: Prevents over-leveraging
- **Dynamic Sizing**: Adjusts based on setup confidence
- **Balance Protection**: Stops trading if account drops significantly

### News Safety
- **Red Folder Filtering**: Avoids high-impact economic news
- **Event Scheduling**: Knows when major announcements occur
- **Volatility Detection**: Pauses trading during unusual market conditions
- **Time-based Restrictions**: Avoids trading during known volatile periods

## 🔧 Troubleshooting

### Common Issues

**Bot doesn't start:**
- Check Node.js version (requires 14.0.0+)
- Verify .env configuration
- Ensure all required dependencies are installed

**No trades executed:**
- Check if market is open (9:30 AM - 4:00 PM EST)
- Verify MIN_SETUP_SCORE isn't too high
- Check if news events are preventing trades
- Ensure confluence requirements are met

**Poor performance:**
- Lower MIN_SETUP_SCORE for more trades
- Adjust RISK_PERCENT for position sizing
- Review news filtering settings
- Check learning system metrics

### Debug Mode

Enable debug mode for troubleshooting:

```bash
DEBUG=true VERBOSE_LOGGING=true npm start
```

This will:
- Show detailed market analysis
- Log all trading decisions
- Display learning algorithm progress
- Provide comprehensive trade breakdowns

## 📊 Example Output

```
🤖 NASDAQ 100 FUTURES TRADING BOT STATUS:
⏰ Market Status: OPEN
💰 Account Balance: $100,000.00
📈 Total P&L: $1,250.00
🎯 Trades Today: 1/1
📰 News Safety: SAFE

📊 TRADE COMPLETED:
   Result: WIN (TAKE_PROFIT)
   Entry: $15,125.50 → Exit: $15,275.25
   P&L: $1,250.00 (0.99%)
   Duration: 145 minutes

📈 LEARNING METRICS:
   Win Rate: 73.5%
   Profit Factor: 2.1
   Consecutive: 3W / 0L

🧠 LEARNING INSIGHTS:
   Setup Score: 7/10
   Confluence: Strong bullish alignment
   News Environment: Safe trading conditions
   Learning Points: High confidence setup succeeded, ES confirmation reliable
```

## 📄 License

MIT License - see LICENSE file for details.

## ⚠️ Disclaimer

This trading bot is for educational and research purposes. Trading futures involves substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results. Use at your own risk and ensure compliance with all applicable regulations.

## 🆘 Support

- **Documentation**: Comprehensive setup and usage guides
- **Issues**: Report bugs and feature requests on GitHub  
- **Examples**: Working examples in `examples/` directory

---

**Made with ❤️ for algorithmic traders**
