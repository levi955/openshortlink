/**
 * Mining Bot - Main Bot Logic
 * Handles web automation, game detection, and automated gameplay
 */

const puppeteer = require('puppeteer');
const { BrowserUtils } = require('./utils');
const { GameAnalyzer } = require('./game');

class MiningBot {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.browser = null;
        this.page = null;
        this.browserUtils = null;
        this.gameAnalyzer = null;
        this.isRunning = false;
        this.currentGame = null;
        this.gameHistory = [];
        this.sessionStats = {
            startTime: new Date(),
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            streak: 0,
            bestStreak: 0
        };
    }
    
    /**
     * Start the mining bot
     */
    async start() {
        try {
            this.logger.info('🚀 Initializing Ultimate Mine Bot...');
            
            // Initialize browser
            await this.initializeBrowser();
            
            // Initialize game analyzer
            this.gameAnalyzer = new GameAnalyzer(this.logger, this.config);
            
            // Navigate to the mining site
            await this.navigateToSite();
            
            // Start the main bot loop
            this.isRunning = true;
            await this.mainLoop();
            
        } catch (error) {
            this.logger.error('❌ Bot startup failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Initialize Puppeteer browser
     */
    async initializeBrowser() {
        this.logger.info('🌐 Launching browser...');
        
        const launchOptions = {
            headless: this.config.get('HEADLESS'),
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        };
        
        if (this.config.get('DEBUG')) {
            launchOptions.devtools = true;
            launchOptions.slowMo = 100;
        }
        
        this.browser = await puppeteer.launch(launchOptions);
        this.page = await this.browser.newPage();
        
        // Set viewport and user agent
        await this.page.setViewport({
            width: this.config.get('VIEWPORT_WIDTH'),
            height: this.config.get('VIEWPORT_HEIGHT')
        });
        
        await this.page.setUserAgent(this.config.get('USER_AGENT'));
        
        // Initialize browser utilities
        this.browserUtils = new BrowserUtils(this.page, this.logger);
        
        this.logger.info('✅ Browser initialized successfully');
    }
    
    /**
     * Navigate to the mining site
     */
    async navigateToSite() {
        const siteUrl = this.config.get('SITE_URL');
        
        if (!siteUrl) {
            throw new Error('SITE_URL not configured');
        }
        
        this.logger.info(`🌍 Navigating to: ${siteUrl}`);
        
        try {
            await this.page.goto(siteUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            await this.browserUtils.delay(2000);
            
            // Take initial screenshot
            if (this.config.get('TAKE_SCREENSHOT')) {
                await this.browserUtils.takeScreenshot('site-loaded');
            }
            
            this.logger.info('✅ Successfully navigated to site');
            
        } catch (error) {
            this.logger.error('❌ Failed to navigate to site:', error.message);
            throw error;
        }
    }
    
    /**
     * Main bot execution loop
     */
    async mainLoop() {
        this.logger.info('🎮 Starting main game loop...');
        
        try {
            // Login if credentials are provided
            if (this.config.get('USERNAME') && this.config.get('PASSWORD')) {
                await this.performLogin();
            }
            
            // Wait for game to be available
            await this.waitForGame();
            
            // Main game loop
            while (this.isRunning && this.sessionStats.gamesPlayed < this.config.get('MAX_GAMES')) {
                try {
                    await this.playGame();
                    
                    // Delay between games
                    const delay = this.browserUtils.randomDelay(
                        this.config.get('DELAY_MIN'),
                        this.config.get('DELAY_MAX')
                    );
                    
                    this.logger.info(`⏳ Waiting ${delay}ms before next game...`);
                    await this.browserUtils.delay(delay);
                    
                } catch (gameError) {
                    this.logger.error('🎮 Game error:', gameError.message);
                    
                    // Take error screenshot
                    if (this.config.get('TAKE_SCREENSHOT')) {
                        await this.browserUtils.takeScreenshot('game-error');
                    }
                    
                    // Check if we should stop on errors
                    if (this.shouldStopOnError(gameError)) {
                        this.logger.warn('🛑 Stopping due to error conditions');
                        break;
                    }
                    
                    // Recovery delay
                    await this.browserUtils.delay(5000);
                }
            }
            
            this.logger.info('🏁 Game loop completed');
            this.printSessionSummary();
            
        } catch (error) {
            this.logger.error('❌ Main loop error:', error.message);
            throw error;
        }
    }
    
    /**
     * Perform login if credentials are available
     */
    async performLogin() {
        this.logger.info('🔐 Attempting to log in...');
        
        try {
            // Common login selectors (customize based on actual site)
            const loginSelectors = [
                'input[type="email"]',
                'input[name="username"]',
                'input[name="email"]',
                '#email',
                '#username'
            ];
            
            const passwordSelectors = [
                'input[type="password"]',
                'input[name="password"]',
                '#password'
            ];
            
            const submitSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                '.login-button',
                '#login-button'
            ];
            
            // Find and fill username/email
            let usernameField = null;
            for (const selector of loginSelectors) {
                if (await this.browserUtils.elementExists(selector)) {
                    usernameField = selector;
                    break;
                }
            }
            
            if (!usernameField) {
                throw new Error('Username field not found');
            }
            
            await this.browserUtils.humanType(usernameField, this.config.get('USERNAME'));
            this.logger.debug('✅ Username entered');
            
            // Find and fill password
            let passwordField = null;
            for (const selector of passwordSelectors) {
                if (await this.browserUtils.elementExists(selector)) {
                    passwordField = selector;
                    break;
                }
            }
            
            if (!passwordField) {
                throw new Error('Password field not found');
            }
            
            await this.browserUtils.humanType(passwordField, this.config.get('PASSWORD'));
            this.logger.debug('✅ Password entered');
            
            // Find and click submit button
            let submitButton = null;
            for (const selector of submitSelectors) {
                if (await this.browserUtils.elementExists(selector)) {
                    submitButton = selector;
                    break;
                }
            }
            
            if (!submitButton) {
                throw new Error('Submit button not found');
            }
            
            await this.browserUtils.safeClick(submitButton);
            this.logger.debug('✅ Login form submitted');
            
            // Wait for login to complete
            await this.browserUtils.delay(3000);
            
            this.logger.info('✅ Login completed successfully');
            
        } catch (error) {
            this.logger.error('❌ Login failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Wait for game interface to be available
     */
    async waitForGame() {
        this.logger.info('🎯 Waiting for game interface...');
        
        // Common game interface selectors
        const gameSelectors = [
            '.game-board',
            '.minefield',
            '#game',
            '.grid',
            'canvas',
            '.mine-game'
        ];
        
        let gameFound = false;
        const maxAttempts = 10;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            this.logger.debug(`🔍 Looking for game interface (attempt ${attempt}/${maxAttempts})`);
            
            for (const selector of gameSelectors) {
                if (await this.browserUtils.elementExists(selector)) {
                    this.logger.info(`✅ Game interface found: ${selector}`);
                    gameFound = true;
                    break;
                }
            }
            
            if (gameFound) break;
            
            await this.browserUtils.delay(2000);
        }
        
        if (!gameFound) {
            throw new Error('Game interface not found after waiting');
        }
    }
    
    /**
     * Play a single game
     */
    async playGame() {
        this.sessionStats.gamesPlayed++;
        this.logger.info(`🎮 Starting game ${this.sessionStats.gamesPlayed}...`);
        
        const gameStartTime = Date.now();
        let gameResult = null;
        
        try {
            // Initialize game state
            this.currentGame = {
                startTime: gameStartTime,
                moves: [],
                grid: null,
                gameState: 'playing'
            };
            
            // Wait for game to be ready
            await this.waitForGameReady();
            
            // Take screenshot at game start
            if (this.config.get('TAKE_SCREENSHOT')) {
                await this.browserUtils.takeScreenshot(`game-${this.sessionStats.gamesPlayed}-start`);
            }
            
            // Main game playing loop
            while (this.currentGame.gameState === 'playing') {
                // Detect current game state
                const gameState = await this.detectGameState();
                
                if (!gameState) {
                    this.logger.warn('⚠️ Could not detect game state');
                    break;
                }
                
                // Analyze and make move
                const move = await this.gameAnalyzer.analyzeGameState(gameState);
                
                if (!move) {
                    this.logger.warn('⚠️ No move available');
                    break;
                }
                
                // Execute the move
                await this.executeMove(move);
                
                // Check game status
                const newGameState = await this.detectGameState();
                if (newGameState && newGameState.gameStatus !== 'playing') {
                    this.currentGame.gameState = newGameState.gameStatus;
                    gameResult = {
                        won: newGameState.gameStatus === 'won',
                        time: Date.now() - gameStartTime,
                        moves: this.currentGame.moves.length
                    };
                }
                
                // Delay between moves
                await this.browserUtils.delay(this.config.get('ANALYSIS_DELAY', 500));
            }
            
            // Update statistics
            if (gameResult) {
                this.updateSessionStats(gameResult);
                this.gameAnalyzer.updateStatistics(gameResult);
            }
            
            // Take final screenshot
            if (this.config.get('TAKE_SCREENSHOT')) {
                const status = gameResult ? (gameResult.won ? 'won' : 'lost') : 'unknown';
                await this.browserUtils.takeScreenshot(`game-${this.sessionStats.gamesPlayed}-${status}`);
            }
            
            this.logger.info(`🎮 Game ${this.sessionStats.gamesPlayed} completed: ${gameResult ? (gameResult.won ? '🏆 WON' : '💥 LOST') : '❓ UNKNOWN'}`);
            
        } catch (error) {
            this.logger.error(`❌ Error during game ${this.sessionStats.gamesPlayed}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Wait for game to be ready for playing
     */
    async waitForGameReady() {
        // Implementation depends on specific game interface
        // This is a generic approach
        await this.browserUtils.delay(1000);
        
        // Look for start button or game grid
        const startSelectors = [
            '.start-button',
            '.new-game',
            '.play-button',
            'button:contains("Start")',
            'button:contains("New Game")'
        ];
        
        for (const selector of startSelectors) {
            if (await this.browserUtils.elementExists(selector)) {
                await this.browserUtils.safeClick(selector);
                this.logger.debug('🎯 Game started');
                await this.browserUtils.delay(1000);
                break;
            }
        }
    }
    
    /**
     * Detect current game state from the page
     */
    async detectGameState() {
        try {
            // This is a generic implementation
            // Real implementation would need to be customized for specific games
            
            // Look for game grid
            const gridSelectors = [
                '.game-grid td',
                '.cell',
                '.square',
                'canvas'
            ];
            
            let grid = null;
            
            for (const selector of gridSelectors) {
                const elements = await this.page.$$(selector);
                if (elements.length > 0) {
                    grid = await this.parseGameGrid(elements);
                    break;
                }
            }
            
            if (!grid) {
                return null;
            }
            
            // Detect game status
            let gameStatus = 'playing';
            
            // Check for win/loss indicators
            if (await this.browserUtils.elementExists('.game-won, .victory, .win')) {
                gameStatus = 'won';
            } else if (await this.browserUtils.elementExists('.game-over, .defeat, .loss')) {
                gameStatus = 'lost';
            }
            
            return {
                grid: grid,
                gameStatus: gameStatus,
                mines: this.estimateMineCount(grid),
                revealed: this.countRevealedCells(grid)
            };
            
        } catch (error) {
            this.logger.error('Game state detection failed:', error.message);
            return null;
        }
    }
    
    /**
     * Parse game grid from DOM elements
     */
    async parseGameGrid(elements) {
        // This is a simplified implementation
        // Real implementation would need to parse actual game interface
        
        const grid = [];
        const gridSize = Math.sqrt(elements.length);
        
        for (let i = 0; i < elements.length; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            if (!grid[row]) {
                grid[row] = [];
            }
            
            // Analyze cell state (this would be game-specific)
            const element = elements[i];
            const cellData = await this.page.evaluate(el => ({
                text: el.textContent.trim(),
                className: el.className,
                style: el.style.cssText
            }), element);
            
            grid[row][col] = {
                x: col,
                y: row,
                isRevealed: cellData.className.includes('revealed') || cellData.text !== '',
                isFlagged: cellData.className.includes('flagged'),
                isMine: cellData.className.includes('mine'),
                number: parseInt(cellData.text) || undefined
            };
        }
        
        return grid;
    }
    
    /**
     * Execute a move on the game board
     */
    async executeMove(move) {
        try {
            this.logger.debug(`🎯 Executing move: (${move.x}, ${move.y}) type: ${move.type}`);
            
            // Find the cell element to click
            const selector = this.getCellSelector(move.x, move.y);
            
            if (move.type === 'flag') {
                // Right click to flag
                await this.page.click(selector, { button: 'right' });
            } else {
                // Left click to reveal
                await this.browserUtils.safeClick(selector);
            }
            
            // Record the move
            this.currentGame.moves.push({
                ...move,
                timestamp: Date.now()
            });
            
            // Delay after move
            await this.browserUtils.delay(this.config.get('CLICK_DELAY', 200));
            
        } catch (error) {
            this.logger.error(`❌ Failed to execute move:`, error.message);
            throw error;
        }
    }
    
    /**
     * Get CSS selector for a specific cell
     */
    getCellSelector(x, y) {
        // This would need to be customized for specific games
        // Common patterns:
        return `.cell[data-x="${x}"][data-y="${y}"], .row:nth-child(${y + 1}) .cell:nth-child(${x + 1}), td:nth-child(${x + 1})`;
    }
    
    /**
     * Estimate number of mines in the game
     */
    estimateMineCount(grid) {
        // Default estimation - usually 15-20% of cells
        const totalCells = grid.length * grid[0].length;
        return Math.floor(totalCells * 0.15);
    }
    
    /**
     * Count revealed cells in grid
     */
    countRevealedCells(grid) {
        let count = 0;
        for (let row of grid) {
            for (let cell of row) {
                if (cell.isRevealed) count++;
            }
        }
        return count;
    }
    
    /**
     * Update session statistics
     */
    updateSessionStats(gameResult) {
        if (gameResult.won) {
            this.sessionStats.wins++;
            this.sessionStats.streak++;
            this.sessionStats.bestStreak = Math.max(this.sessionStats.bestStreak, this.sessionStats.streak);
        } else {
            this.sessionStats.losses++;
            this.sessionStats.streak = 0;
        }
    }
    
    /**
     * Check if bot should stop due to error conditions
     */
    shouldStopOnError(error) {
        if (this.config.get('STOP_ON_LOSS') && this.sessionStats.streak === 0) {
            const lossStreak = this.sessionStats.gamesPlayed - this.sessionStats.wins;
            if (lossStreak >= this.config.get('MAX_LOSS_STREAK')) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Print session summary
     */
    printSessionSummary() {
        const duration = Date.now() - this.sessionStats.startTime.getTime();
        const winRate = this.sessionStats.gamesPlayed > 0 ? 
            (this.sessionStats.wins / this.sessionStats.gamesPlayed * 100).toFixed(1) : 0;
        
        this.logger.info('\\n📊 SESSION SUMMARY:');
        this.logger.info(`⏱️  Duration: ${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`);
        this.logger.info(`🎮 Games Played: ${this.sessionStats.gamesPlayed}`);
        this.logger.info(`🏆 Wins: ${this.sessionStats.wins}`);
        this.logger.info(`💥 Losses: ${this.sessionStats.losses}`);
        this.logger.info(`📈 Win Rate: ${winRate}%`);
        this.logger.info(`🔥 Best Streak: ${this.sessionStats.bestStreak}`);
        this.logger.info(`⚡ Current Streak: ${this.sessionStats.streak}`);
    }
    
    /**
     * Shutdown the bot gracefully
     */
    async shutdown() {
        this.logger.info('🛑 Shutting down bot...');
        this.isRunning = false;
        
        try {
            if (this.browser) {
                await this.browser.close();
                this.logger.info('✅ Browser closed');
            }
        } catch (error) {
            this.logger.error('❌ Error during shutdown:', error.message);
        }
        
        this.logger.info('✅ Bot shutdown complete');
    }
}

module.exports = { MiningBot };