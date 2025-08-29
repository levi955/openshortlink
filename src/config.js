/**
 * Configuration Management
 * Handles all configuration settings and validation
 */

const path = require('path');
const fs = require('fs');

class Config {
    constructor() {
        this.config = {
            // Bandit.camp Site Configuration
            SITE_URL: process.env.SITE_URL || 'https://bandit.camp/mines',
            STEAM_USERNAME: process.env.STEAM_USERNAME || '',
            STEAM_PASSWORD: process.env.STEAM_PASSWORD || '',
            STEAM_GUARD_CODE: process.env.STEAM_GUARD_CODE || '',
            
            // Bot Behavior
            HEADLESS: process.env.HEADLESS === 'true',
            AUTO_PLAY: process.env.AUTO_PLAY === 'true',
            DELAY_MIN: parseInt(process.env.DELAY_MIN) || 1000,
            DELAY_MAX: parseInt(process.env.DELAY_MAX) || 3000,
            MAX_GAMES: parseInt(process.env.MAX_GAMES) || 50,
            
            // Bandit.camp Betting Settings
            INITIAL_BET_AMOUNT: parseFloat(process.env.INITIAL_BET_AMOUNT) || 1.00,
            MIN_BET_AMOUNT: parseFloat(process.env.MIN_BET_AMOUNT) || 0.10,
            MAX_BET_AMOUNT: parseFloat(process.env.MAX_BET_AMOUNT) || 100.00,
            BET_MULTIPLIER: parseFloat(process.env.BET_MULTIPLIER) || 1.5,
            MIN_MINES: parseInt(process.env.MIN_MINES) || 3,
            MAX_MINES: parseInt(process.env.MAX_MINES) || 24,
            
            // Advanced Betting Strategies
            BETTING_STRATEGY: process.env.BETTING_STRATEGY || 'adaptive',
            CONSERVATIVE_MULTIPLIER: parseFloat(process.env.CONSERVATIVE_MULTIPLIER) || 1.2,
            AGGRESSIVE_MULTIPLIER: parseFloat(process.env.AGGRESSIVE_MULTIPLIER) || 2.5,
            BALANCE_PROTECTION_THRESHOLD: parseFloat(process.env.BALANCE_PROTECTION_THRESHOLD) || 0.1,
            PROFIT_TARGET_MULTIPLIER: parseFloat(process.env.PROFIT_TARGET_MULTIPLIER) || 1.5,
            
            // Smart Cheating Settings
            ENABLE_SMART_CHEATING: process.env.ENABLE_SMART_CHEATING === 'true',
            WIN_RATE_THRESHOLD: parseFloat(process.env.WIN_RATE_THRESHOLD) || 0.3,
            CHEATING_CONFIDENCE_LEVEL: parseFloat(process.env.CHEATING_CONFIDENCE_LEVEL) || 0.85,
            MAX_CONSECUTIVE_LOSSES: parseInt(process.env.MAX_CONSECUTIVE_LOSSES) || 5,
            
            // Safety Settings
            STOP_ON_LOSS: process.env.STOP_ON_LOSS === 'true',
            MAX_LOSS_STREAK: parseInt(process.env.MAX_LOSS_STREAK) || 3,
            TAKE_SCREENSHOT: process.env.TAKE_SCREENSHOT === 'true',
            AUTO_CASHOUT: process.env.AUTO_CASHOUT === 'true',
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
            site: this.config.SITE_URL || 'Not configured',
            headless: this.config.HEADLESS,
            autoPlay: this.config.AUTO_PLAY,
            maxGames: this.config.MAX_GAMES,
            debug: this.config.DEBUG
        };
        return JSON.stringify(summary, null, 2);
    }
    
    async validate() {
        const errors = [];
        
        // Check required environment variables for bandit.camp
        if (!this.config.SITE_URL) {
            errors.push('SITE_URL is required (should be https://bandit.camp/mines)');
        }
        
        if (this.config.AUTO_PLAY && this.config.STEAM_AUTO_LOGIN && 
            (!this.config.STEAM_USERNAME || !this.config.STEAM_PASSWORD)) {
            errors.push('STEAM_USERNAME and STEAM_PASSWORD are required for auto-play mode with Steam login');
        }
        
        // Validate betting amounts
        if (this.config.MIN_BET_AMOUNT <= 0 || this.config.MAX_BET_AMOUNT <= 0) {
            errors.push('Bet amounts must be positive');
        }
        
        if (this.config.MIN_BET_AMOUNT > this.config.MAX_BET_AMOUNT) {
            errors.push('MIN_BET_AMOUNT must be less than or equal to MAX_BET_AMOUNT');
        }
        
        if (this.config.INITIAL_BET_AMOUNT < this.config.MIN_BET_AMOUNT || 
            this.config.INITIAL_BET_AMOUNT > this.config.MAX_BET_AMOUNT) {
            errors.push('INITIAL_BET_AMOUNT must be between MIN_BET_AMOUNT and MAX_BET_AMOUNT');
        }
        
        // Validate mines count
        if (this.config.MIN_MINES < 1 || this.config.MAX_MINES > 24) {
            errors.push('Mines count must be between 1 and 24');
        }
        
        if (this.config.MIN_MINES > this.config.MAX_MINES) {
            errors.push('MIN_MINES must be less than or equal to MAX_MINES');
        }
        
        // Validate thresholds
        if (this.config.WIN_RATE_THRESHOLD < 0 || this.config.WIN_RATE_THRESHOLD > 1) {
            errors.push('WIN_RATE_THRESHOLD must be between 0 and 1');
        }
        
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
        
        if (this.config.MAX_GAMES < 1) {
            errors.push('MAX_GAMES must be at least 1');
        }
        
        // Validate betting strategy
        const validStrategies = ['conservative', 'aggressive', 'adaptive', 'balanced'];
        if (!validStrategies.includes(this.config.BETTING_STRATEGY)) {
            errors.push(`BETTING_STRATEGY must be one of: ${validStrategies.join(', ')}`);
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