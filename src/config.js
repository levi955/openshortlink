/**
 * Configuration Management
 * Handles all configuration settings and validation
 */

const path = require('path');
const fs = require('fs');

class Config {
    constructor() {
        this.config = {
            // Trading Bot Configuration
            TRADING_MODE: process.env.TRADING_MODE || 'futures', // futures, stocks, forex
            SYMBOL: process.env.SYMBOL || 'NQ', // NASDAQ 100 futures
            CONFLUENCE_SYMBOL: process.env.CONFLUENCE_SYMBOL || 'ES', // E-mini S&P 500
            
            // Account Settings
            ACCOUNT_BALANCE: parseFloat(process.env.ACCOUNT_BALANCE) || 100000,
            RISK_PERCENT: parseFloat(process.env.RISK_PERCENT) || 1.0, // 1% risk per trade
            MAX_POSITION_SIZE: parseInt(process.env.MAX_POSITION_SIZE) || 5,
            
            // Trading Rules
            MAX_TRADES_PER_DAY: parseInt(process.env.MAX_TRADES_PER_DAY) || 1,
            MIN_SETUP_SCORE: parseInt(process.env.MIN_SETUP_SCORE) || 5,
            STOP_LOSS_PERCENT: parseFloat(process.env.STOP_LOSS_PERCENT) || 0.5,
            TAKE_PROFIT_PERCENT: parseFloat(process.env.TAKE_PROFIT_PERCENT) || 1.0,
            
            // Market Data Settings
            MARKET_DATA_PROVIDER: process.env.MARKET_DATA_PROVIDER || 'mock',
            MARKET_DATA_API_KEY: process.env.MARKET_DATA_API_KEY || '',
            HISTORICAL_DATA_DAYS: parseInt(process.env.HISTORICAL_DATA_DAYS) || 30,
            
            // News Settings
            NEWS_UPDATE_INTERVAL: parseInt(process.env.NEWS_UPDATE_INTERVAL) || 300000, // 5 minutes
            FOREX_FACTORY_URL: process.env.FOREX_FACTORY_URL || 'https://www.forexfactory.com/calendar',
            FILTER_RED_FOLDER_NEWS: process.env.FILTER_RED_FOLDER_NEWS === 'true',
            NEWS_IMPACT_THRESHOLD: process.env.NEWS_IMPACT_THRESHOLD || 'medium',
            
            // Timing and Monitoring
            DELAY_MIN: parseInt(process.env.DELAY_MIN) || 1000,
            DELAY_MAX: parseInt(process.env.DELAY_MAX) || 3000,
            MONITORING_INTERVAL: parseInt(process.env.MONITORING_INTERVAL) || 10000, // 10 seconds
            
            // Learning and Analytics
            ENABLE_LEARNING: process.env.ENABLE_LEARNING !== 'false',
            PATTERN_LEARNING: process.env.PATTERN_LEARNING !== 'false',
            MEMORY_SIZE: parseInt(process.env.MEMORY_SIZE) || 1000,
            
            // Safety Settings
            STOP_ON_LOSS: process.env.STOP_ON_LOSS === 'true',
            MAX_LOSS_STREAK: parseInt(process.env.MAX_LOSS_STREAK) || 3,
            TAKE_SCREENSHOT: process.env.TAKE_SCREENSHOT === 'true',
            BALANCE_PROTECTION_THRESHOLD: parseFloat(process.env.BALANCE_PROTECTION_THRESHOLD) || 0.1,
            
            // Debug Settings
            DEBUG: process.env.DEBUG === 'true',
            VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true',
            SAVE_LOGS: process.env.SAVE_LOGS !== 'false',
            
            // Deprecated Mining Game Settings (kept for backward compatibility)
            HEADLESS: process.env.HEADLESS === 'true',
            AUTO_PLAY: process.env.AUTO_PLAY === 'true',
            MAX_GAMES: parseInt(process.env.MAX_GAMES) || 50,
            CASHOUT_MULTIPLIER: parseFloat(process.env.CASHOUT_MULTIPLIER) || 2.0,
            
            // Steam Authentication
            STEAM_AUTO_LOGIN: process.env.STEAM_AUTO_LOGIN === 'true',
            STEAM_REMEMBER_LOGIN: process.env.STEAM_REMEMBER_LOGIN === 'true',
            STEAM_SESSION_TIMEOUT: parseInt(process.env.STEAM_SESSION_TIMEOUT) || 3600000,
            
            // Anti-Detection Features
            HUMAN_LIKE_DELAYS: process.env.HUMAN_LIKE_DELAYS === 'true',
            RANDOM_MOUSE_MOVEMENTS: process.env.RANDOM_MOUSE_MOVEMENTS === 'true',
            BROWSER_FINGERPRINT_ROTATION: process.env.BROWSER_FINGERPRINT_ROTATION === 'true',
            SESSION_ROTATION_INTERVAL: parseInt(process.env.SESSION_ROTATION_INTERVAL) || 1800000,
            
            // Debug Settings
            DEBUG: process.env.DEBUG === 'true',
            VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true',
            SAVE_LOGS: process.env.SAVE_LOGS === 'true',
            
            // Advanced Settings
            USER_AGENT: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            VIEWPORT_WIDTH: parseInt(process.env.VIEWPORT_WIDTH) || 1366,
            VIEWPORT_HEIGHT: parseInt(process.env.VIEWPORT_HEIGHT) || 768,
        };
        
        // Bandit.camp Game-specific settings
        this.gameSettings = {
            // Mine detection sensitivity
            MINE_DETECTION_THRESHOLD: 0.85,
            
            // Strategy settings
            CONSERVATIVE_MODE: true,
            PROBABILITY_THRESHOLD: 0.7,
            
            // Timing settings
            CLICK_DELAY: 200,
            ANALYSIS_DELAY: 500,
            
            // Bandit.camp Grid settings
            DEFAULT_GRID_SIZE: 5,
            MAX_GRID_SIZE: 25,
            
            // Pattern recognition
            PATTERN_LEARNING: true,
            MEMORY_SIZE: 1000,
            
            // Bandit.camp specific selectors
            BANDIT_SELECTORS: {
                // Login and Auth
                STEAM_LOGIN_BUTTON: '.steam-login-btn, .btn-steam, [data-testid="steam-login"]',
                LOGIN_STATUS: '.user-info, .profile-info, .logged-in',
                BALANCE_DISPLAY: '.balance, .user-balance, [data-testid="balance"]',
                
                // Game Interface
                MINES_GAME_CONTAINER: '.mines-game, .game-container, [data-game="mines"]',
                GAME_GRID: '.mines-grid, .game-grid, .mine-field',
                MINE_CELL: '.mine-cell, .cell, .grid-cell',
                BET_INPUT: '.bet-amount, .amount-input, [data-testid="bet-input"]',
                MINES_COUNT_INPUT: '.mines-count, .mine-amount, [data-testid="mines-count"]',
                START_GAME_BUTTON: '.start-game, .play-btn, [data-testid="start-game"]',
                CASHOUT_BUTTON: '.cashout, .cash-out, [data-testid="cashout"]',
                
                // Game State
                GAME_ACTIVE: '.game-active, .playing, .in-progress',
                GAME_WON: '.game-won, .victory, .win',
                GAME_LOST: '.game-lost, .bust, .loss',
                MULTIPLIER_DISPLAY: '.multiplier, .payout, .current-multiplier',
                
                // Controls
                AUTO_MODE_TOGGLE: '.auto-mode, .auto-play, [data-testid="auto-mode"]',
                SETTINGS_BUTTON: '.settings, .game-settings, [data-testid="settings"]'
            }
        };
    }
    
    get(key) {
        return this.config[key] !== undefined ? this.config[key] : this.gameSettings[key];
    }
    
    set(key, value) {
        if (this.config.hasOwnProperty(key)) {
            this.config[key] = value;
        } else if (this.gameSettings.hasOwnProperty(key)) {
            this.gameSettings[key] = value;
        }
    }
    
    getAll() {
        return { ...this.config, ...this.gameSettings };
    }
    
    getSummary() {
        const summary = {
            mode: this.config.TRADING_MODE || 'futures',
            symbol: this.config.SYMBOL || 'NQ',
            confluenceSymbol: this.config.CONFLUENCE_SYMBOL || 'ES',
            accountBalance: this.config.ACCOUNT_BALANCE || 100000,
            maxTradesPerDay: this.config.MAX_TRADES_PER_DAY || 1,
            debug: this.config.DEBUG
        };
        return JSON.stringify(summary, null, 2);
    }
    
    async validate() {
        const errors = [];
        
        // Check trading configuration
        const validTradingModes = ['futures', 'stocks', 'forex'];
        if (!validTradingModes.includes(this.config.TRADING_MODE)) {
            errors.push(`TRADING_MODE must be one of: ${validTradingModes.join(', ')}`);
        }
        
        // Validate account settings
        if (this.config.ACCOUNT_BALANCE <= 0) {
            errors.push('ACCOUNT_BALANCE must be positive');
        }
        
        if (this.config.RISK_PERCENT <= 0 || this.config.RISK_PERCENT > 10) {
            errors.push('RISK_PERCENT must be between 0 and 10');
        }
        
        if (this.config.MAX_POSITION_SIZE <= 0) {
            errors.push('MAX_POSITION_SIZE must be positive');
        }
        
        // Validate trading rules
        if (this.config.MAX_TRADES_PER_DAY < 1 || this.config.MAX_TRADES_PER_DAY > 10) {
            errors.push('MAX_TRADES_PER_DAY must be between 1 and 10');
        }
        
        if (this.config.MIN_SETUP_SCORE < 1 || this.config.MIN_SETUP_SCORE > 10) {
            errors.push('MIN_SETUP_SCORE must be between 1 and 10');
        }
        
        if (this.config.STOP_LOSS_PERCENT <= 0 || this.config.STOP_LOSS_PERCENT > 5) {
            errors.push('STOP_LOSS_PERCENT must be between 0 and 5');
        }
        
        if (this.config.TAKE_PROFIT_PERCENT <= 0 || this.config.TAKE_PROFIT_PERCENT > 10) {
            errors.push('TAKE_PROFIT_PERCENT must be between 0 and 10');
        }
        
        // Validate thresholds
        if (this.config.BALANCE_PROTECTION_THRESHOLD < 0 || this.config.BALANCE_PROTECTION_THRESHOLD > 1) {
            errors.push('BALANCE_PROTECTION_THRESHOLD must be between 0 and 1');
        }
        
        // Validate numeric values
        if (this.config.DELAY_MIN < 0 || this.config.DELAY_MAX < 0) {
            errors.push('Delay values must be positive');
        }
        
        if (this.config.DELAY_MIN > this.config.DELAY_MAX) {
            errors.push('DELAY_MIN must be less than or equal to DELAY_MAX');
        }
        
        if (this.config.MONITORING_INTERVAL < 1000) {
            errors.push('MONITORING_INTERVAL must be at least 1000ms');
        }
        
        if (this.config.NEWS_UPDATE_INTERVAL < 60000) {
            errors.push('NEWS_UPDATE_INTERVAL must be at least 60000ms (1 minute)');
        }
        
        // Check .env file exists
        const envPath = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) {
            console.warn('⚠️  .env file not found. Copy .env.example to .env and configure your settings.');
        }
        
        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
        
        return true;
    }
    
    // Load configuration from file
    loadFromFile(filePath) {
        try {
            const configData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            Object.keys(configData).forEach(key => {
                this.set(key, configData[key]);
            });
        } catch (error) {
            throw new Error(`Failed to load configuration from ${filePath}: ${error.message}`);
        }
    }
    
    // Save configuration to file
    saveToFile(filePath) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(this.getAll(), null, 2));
        } catch (error) {
            throw new Error(`Failed to save configuration to ${filePath}: ${error.message}`);
        }
    }
}

module.exports = { Config };