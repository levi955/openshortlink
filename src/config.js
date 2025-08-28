/**
 * Configuration Management
 * Handles all configuration settings and validation
 */

const path = require('path');
const fs = require('fs');

class Config {
    constructor() {
        this.config = {
            // Site Configuration
            SITE_URL: process.env.SITE_URL || '',
            USERNAME: process.env.USERNAME || '',
            PASSWORD: process.env.PASSWORD || '',
            
            // Bot Behavior
            HEADLESS: process.env.HEADLESS === 'true',
            AUTO_PLAY: process.env.AUTO_PLAY === 'true',
            DELAY_MIN: parseInt(process.env.DELAY_MIN) || 1000,
            DELAY_MAX: parseInt(process.env.DELAY_MAX) || 3000,
            MAX_GAMES: parseInt(process.env.MAX_GAMES) || 10,
            
            // Safety Settings
            STOP_ON_LOSS: process.env.STOP_ON_LOSS === 'true',
            MAX_LOSS_STREAK: parseInt(process.env.MAX_LOSS_STREAK) || 3,
            TAKE_SCREENSHOT: process.env.TAKE_SCREENSHOT === 'true',
            
            // Debug Settings
            DEBUG: process.env.DEBUG === 'true',
            VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true',
            SAVE_LOGS: process.env.SAVE_LOGS === 'true',
            
            // Advanced Settings
            USER_AGENT: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            VIEWPORT_WIDTH: parseInt(process.env.VIEWPORT_WIDTH) || 1366,
            VIEWPORT_HEIGHT: parseInt(process.env.VIEWPORT_HEIGHT) || 768,
        };
        
        // Game-specific settings
        this.gameSettings = {
            // Mine detection sensitivity
            MINE_DETECTION_THRESHOLD: 0.85,
            
            // Strategy settings
            CONSERVATIVE_MODE: true,
            PROBABILITY_THRESHOLD: 0.7,
            
            // Timing settings
            CLICK_DELAY: 200,
            ANALYSIS_DELAY: 500,
            
            // Grid settings
            DEFAULT_GRID_SIZE: 5,
            MAX_GRID_SIZE: 10,
            
            // Pattern recognition
            PATTERN_LEARNING: true,
            MEMORY_SIZE: 1000,
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
        
        // Check required environment variables
        if (!this.config.SITE_URL) {
            errors.push('SITE_URL is required');
        }
        
        if (this.config.AUTO_PLAY && (!this.config.USERNAME || !this.config.PASSWORD)) {
            errors.push('USERNAME and PASSWORD are required for auto-play mode');
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
        
        // Check .env file exists
        const envPath = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) {
            console.warn('⚠️  .env file not found. Copy .env.example to .env and configure your settings.');
        }
        
        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\\n${errors.join('\\n')}`);
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