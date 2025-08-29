/**
 * Utility Functions and Classes
 * Helper functions for browser management, logging, and automation
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Logger class for consistent logging across the application
 */
class Logger {
    constructor(options = {}) {
        this.options = {
            saveToFile: options.saveToFile !== false,
            logLevel: options.logLevel || 'info',
            logFile: options.logFile || 'bot.log',
            ...options
        };
        
        this.logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            verbose: 4
        };
        
        // Ensure logs directory exists
        if (this.options.saveToFile) {
            const logDir = path.dirname(this.options.logFile);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        }
    }
    
    _log(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const levelNum = this.logLevels[level] || 2;
        const configuredLevel = this.logLevels[this.options.logLevel] || 2;
        
        if (levelNum <= configuredLevel) {
            // Console output with colors
            const colors = {
                error: chalk.red,
                warn: chalk.yellow,
                info: chalk.cyan,
                debug: chalk.gray,
                verbose: chalk.dim
            };
            
            const coloredLevel = colors[level] || chalk.white;
            console.log(coloredLevel(`[${timestamp}] [${level.toUpperCase()}]`), message, ...args);
            
            // File output
            if (this.options.saveToFile) {
                const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${args.join(' ')}\\n`;
                try {
                    fs.appendFileSync(this.options.logFile, logEntry);
                } catch (error) {
                    console.error('Failed to write to log file:', error.message);
                }
            }
        }
    }
    
    error(message, ...args) {
        this._log('error', message, ...args);
    }
    
    warn(message, ...args) {
        this._log('warn', message, ...args);
    }
    
    info(message, ...args) {
        this._log('info', message, ...args);
    }
    
    debug(message, ...args) {
        this._log('debug', message, ...args);
    }
    
    verbose(message, ...args) {
        this._log('verbose', message, ...args);
    }
}

/**
 * Browser utilities for Puppeteer automation
 */
class BrowserUtils {
    constructor(page, logger) {
        this.page = page;
        this.logger = logger;
    }
    
    // Wait for element with timeout
    async waitForElement(selector, timeout = 10000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            this.logger.warn(`Element not found: ${selector}`);
            return false;
        }
    }
    
    // Safe click with retry and human-like behavior
    async safeClick(selector, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                await this.page.waitForSelector(selector, { timeout: 5000 });
                
                // Add human-like pre-click behavior
                await this.humanPreClickBehavior(selector);
                
                await this.page.click(selector);
                this.logger.debug(`Clicked: ${selector}`);
                
                // Add small post-click delay
                await this.delay(this.randomDelay(100, 300));
                
                return true;
            } catch (error) {
                this.logger.warn(`Click attempt ${i + 1} failed for ${selector}: ${error.message}`);
                if (i === retries - 1) {
                    throw error;
                }
                await this.delay(1000);
            }
        }
        return false;
    }

    // Human-like pre-click behavior
    async humanPreClickBehavior(selector) {
        try {
            // Move mouse to element with human-like path
            const element = await this.page.$(selector);
            if (element) {
                const box = await element.boundingBox();
                if (box) {
                    // Move to a random point within the element
                    const x = box.x + Math.random() * box.width;
                    const y = box.y + Math.random() * box.height;
                    
                    await this.page.mouse.move(x, y, {
                        steps: Math.floor(Math.random() * 10) + 5
                    });
                    
                    // Small delay before clicking
                    await this.delay(this.randomDelay(50, 200));
                }
            }
        } catch (error) {
            // Ignore errors in pre-click behavior
        }
    }

    // Enhanced human typing with more realistic patterns
    async humanType(selector, text, delayRange = [50, 150]) {
        await this.page.waitForSelector(selector);
        await this.page.click(selector);
        
        // Clear existing text
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('a');
        await this.page.keyboard.up('Control');
        await this.delay(this.randomDelay(50, 100));
        
        // Type with human-like patterns
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            // Simulate occasional typos and corrections
            if (Math.random() < 0.02 && i > 0) { // 2% chance of typo
                const wrongChar = String.fromCharCode(char.charCodeAt(0) + 1);
                await this.page.keyboard.type(wrongChar);
                await this.delay(this.randomDelay(100, 300));
                await this.page.keyboard.press('Backspace');
                await this.delay(this.randomDelay(50, 150));
            }
            
            await this.page.keyboard.type(char);
            
            // Variable typing speed with occasional pauses
            let delay = this.randomDelay(delayRange[0], delayRange[1]);
            
            // Longer pause after spaces or punctuation
            if (char === ' ' || char === '.' || char === ',') {
                delay *= 1.5;
            }
            
            // Occasional longer pauses (thinking)
            if (Math.random() < 0.05) {
                delay *= 3;
            }
            
            await this.delay(delay);
        }
    }

    // Enhanced random mouse movement
    async performRandomMouseMovement() {
        try {
            const viewport = await this.page.viewport();
            const movements = Math.floor(Math.random() * 5) + 1;
            
            for (let i = 0; i < movements; i++) {
                const x = Math.random() * viewport.width;
                const y = Math.random() * viewport.height;
                
                await this.page.mouse.move(x, y, {
                    steps: Math.floor(Math.random() * 20) + 10
                });
                
                // Occasional clicks on empty areas
                if (Math.random() < 0.1) {
                    await this.page.mouse.click(x, y);
                }
                
                await this.delay(this.randomDelay(500, 1500));
            }
        } catch (error) {
            this.logger.debug('⚠️ Random mouse movement failed:', error.message);
        }
    }

    // Simulate human scrolling behavior
    async humanScroll() {
        try {
            const scrolls = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < scrolls; i++) {
                const scrollAmount = (Math.random() - 0.5) * 1000; // Random scroll direction and amount
                
                await this.page.evaluate((amount) => {
                    window.scrollBy(0, amount);
                }, scrollAmount);
                
                await this.delay(this.randomDelay(500, 1000));
            }
        } catch (error) {
            this.logger.debug('⚠️ Human scroll failed:', error.message);
        }
    }

    // Simulate reading behavior (pauses)
    async simulateReading(duration = null) {
        if (!duration) {
            duration = this.randomDelay(3000, 8000);
        }
        
        this.logger.debug(`📖 Simulating reading for ${duration}ms`);
        
        // Occasional mouse movements during reading
        const movements = Math.floor(duration / 2000);
        for (let i = 0; i < movements; i++) {
            await this.delay(duration / movements);
            
            if (Math.random() < 0.3) {
                await this.performRandomMouseMovement();
            }
        }
    }

    // Anti-bot detection delays
    async antiDetectionDelay() {
        const baseDelay = this.randomDelay(1000, 3000);
        
        // Longer delays occasionally
        if (Math.random() < 0.1) {
            await this.delay(baseDelay * 3);
            await this.performRandomMouseMovement();
        } else {
            await this.delay(baseDelay);
        }
    }
    
    // Get element text safely
    async getElementText(selector) {
        try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
            return await this.page.$eval(selector, el => el.textContent.trim());
        } catch (error) {
            this.logger.warn(`Failed to get text from ${selector}: ${error.message}`);
            return null;
        }
    }
    
    // Check if element exists
    async elementExists(selector) {
        try {
            const element = await this.page.$(selector);
            return element !== null;
        } catch (error) {
            return false;
        }
    }
    
    // Take screenshot with timestamp
    async takeScreenshot(name = 'screenshot') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${name}-${timestamp}.png`;
        const screenshotPath = path.join('screenshots', filename);
        
        // Ensure screenshots directory exists
        if (!fs.existsSync('screenshots')) {
            fs.mkdirSync('screenshots', { recursive: true });
        }
        
        try {
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: true
            });
            this.logger.info(`📸 Screenshot saved: ${screenshotPath}`);
            return screenshotPath;
        } catch (error) {
            this.logger.error(`Failed to take screenshot: ${error.message}`);
            return null;
        }
    }
    
    // Scroll element into view
    async scrollToElement(selector) {
        try {
            await this.page.$eval(selector, element => {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            await this.delay(500);
        } catch (error) {
            this.logger.warn(`Failed to scroll to ${selector}: ${error.message}`);
        }
    }
    
    // Random delay between min and max
    randomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Delay helper
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Math utilities for game analysis
 */
class MathUtils {
    // Calculate probability based on revealed cells
    static calculateProbability(revealedCells, totalCells, mines) {
        const remainingCells = totalCells - revealedCells.length;
        const remainingMines = mines - revealedCells.filter(cell => cell.isMine).length;
        
        if (remainingCells === 0) return 0;
        return Math.max(0, Math.min(1, remainingMines / remainingCells));
    }
    
    // Calculate safety score for a cell
    static calculateSafetyScore(cell, neighbors, gameState) {
        let score = 0.5; // Base score
        
        // Analyze neighbor patterns
        neighbors.forEach(neighbor => {
            if (neighbor.isRevealed && neighbor.number !== undefined) {
                const surroundingMines = neighbor.number;
                const surroundingFlags = neighbor.surroundingFlags || 0;
                const surroundingUnrevealed = neighbor.surroundingUnrevealed || 0;
                
                if (surroundingMines === surroundingFlags) {
                    score += 0.3; // Safer if neighbor's mines are all flagged
                }
                
                if (surroundingUnrevealed > 0) {
                    const probability = (surroundingMines - surroundingFlags) / surroundingUnrevealed;
                    score -= probability * 0.4;
                }
            }
        });
        
        return Math.max(0, Math.min(1, score));
    }
    
    // Generate weighted random choice
    static weightedRandomChoice(options) {
        const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const option of options) {
            random -= option.weight;
            if (random <= 0) {
                return option;
            }
        }
        
        return options[options.length - 1];
    }
}

/**
 * Pattern recognition utilities
 */
class PatternUtils {
    // Detect common minesweeper patterns
    static detectPatterns(grid, position) {
        const patterns = [];
        const { x, y } = position;
        
        // 1-2-1 pattern detection
        if (this.detect121Pattern(grid, x, y)) {
            patterns.push({ type: '1-2-1', confidence: 0.9 });
        }
        
        // Corner patterns
        if (this.detectCornerPattern(grid, x, y)) {
            patterns.push({ type: 'corner', confidence: 0.8 });
        }
        
        // Edge patterns
        if (this.detectEdgePattern(grid, x, y)) {
            patterns.push({ type: 'edge', confidence: 0.7 });
        }
        
        return patterns;
    }
    
    static detect121Pattern(grid, x, y) {
        // Implementation for 1-2-1 pattern detection
        // This is a simplified version - real implementation would be more complex
        try {
            const cell = grid[y] && grid[y][x];
            if (!cell || !cell.isRevealed || cell.number !== 2) return false;
            
            // Check horizontal 1-2-1
            const left = grid[y] && grid[y][x - 1];
            const right = grid[y] && grid[y][x + 1];
            
            if (left && right && left.number === 1 && right.number === 1) {
                return true;
            }
            
            // Check vertical 1-2-1
            const top = grid[y - 1] && grid[y - 1][x];
            const bottom = grid[y + 1] && grid[y + 1][x];
            
            if (top && bottom && top.number === 1 && bottom.number === 1) {
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }
    
    static detectCornerPattern(grid, x, y) {
        // Simplified corner pattern detection
        const maxX = grid[0] ? grid[0].length - 1 : 0;
        const maxY = grid.length - 1;
        
        return (x === 0 || x === maxX) && (y === 0 || y === maxY);
    }
    
    static detectEdgePattern(grid, x, y) {
        // Simplified edge pattern detection
        const maxX = grid[0] ? grid[0].length - 1 : 0;
        const maxY = grid.length - 1;
        
        return x === 0 || x === maxX || y === 0 || y === maxY;
    }
}

module.exports = {
    Logger,
    BrowserUtils,
    MathUtils,
    PatternUtils
};