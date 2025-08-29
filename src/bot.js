/**
 * Mining Bot - Main Bot Logic
 * Specialized for bandit.camp/mines with Steam authentication and advanced strategies
 */

const puppeteer = require('puppeteer');
const { BrowserUtils } = require('./utils');
const { GameAnalyzer } = require('./game');
const { SteamAuth } = require('./steam-auth');

class MiningBot {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.browser = null;
        this.page = null;
        this.browserUtils = null;
        this.gameAnalyzer = null;
        this.steamAuth = null;
        this.isRunning = false;
        this.currentGame = null;
        this.gameHistory = [];
        this.sessionStats = {
            startTime: new Date(),
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            streak: 0,
            bestStreak: 0,
            totalProfit: 0,
            currentBalance: 0,
            startBalance: 0,
            consecutiveLosses: 0,
            winRate: 0
        };
        this.bettingStrategy = this.config.get('BETTING_STRATEGY');
        this.currentBetAmount = this.config.get('INITIAL_BET_AMOUNT');
        this.smartCheatingEnabled = false;
    }
    
    /**
     * Start the mining bot
     */
    async start() {
        try {
            this.logger.info('🚀 Initializing Ultimate Mine Bot for bandit.camp...');
            
            // Initialize browser
            await this.initializeBrowser();
            
            // Initialize Steam authentication
            this.steamAuth = new SteamAuth(this.page, this.logger, this.config);
            
            // Initialize game analyzer with enhanced features
            this.gameAnalyzer = new GameAnalyzer(this.logger, this.config);
            
            // Navigate to bandit.camp/mines
            await this.navigateToBanditCamp();
            
            // Handle Steam authentication
            await this.handleAuthentication();
            
            // Initialize bandit.camp specific features
            await this.initializeBanditCampFeatures();
            
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
     * Navigate to bandit.camp/mines specifically
     */
    async navigateToBanditCamp() {
        const siteUrl = this.config.get('SITE_URL');
        
        if (!siteUrl.includes('bandit.camp')) {
            this.logger.warn('⚠️ Site URL is not bandit.camp, updating to https://bandit.camp/mines');
            this.config.set('SITE_URL', 'https://bandit.camp/mines');
        }
        
        this.logger.info(`🌍 Navigating to bandit.camp/mines...`);
        
        try {
            await this.page.goto('https://bandit.camp/mines', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            await this.browserUtils.delay(3000);
            
            // Take initial screenshot
            if (this.config.get('TAKE_SCREENSHOT')) {
                await this.browserUtils.takeScreenshot('bandit-camp-loaded');
            }
            
            this.logger.info('✅ Successfully navigated to bandit.camp/mines');
            
        } catch (error) {
            this.logger.error('❌ Failed to navigate to bandit.camp:', error.message);
            throw error;
        }
    }

    /**
     * Handle Steam authentication for bandit.camp
     */
    async handleAuthentication() {
        try {
            this.logger.info('🔐 Handling authentication for bandit.camp...');
            
            // Use Steam authentication handler
            await this.steamAuth.authenticate();
            
            // Wait for page to settle after authentication
            await this.browserUtils.delay(3000);
            
            // Verify we're on the mines game page
            await this.ensureOnMinesPage();
            
            this.logger.info('✅ Authentication completed successfully');
            
        } catch (error) {
            this.logger.error('❌ Authentication failed:', error.message);
            throw error;
        }
    }

    /**
     * Ensure we're on the mines game page
     */
    async ensureOnMinesPage() {
        try {
            const currentUrl = this.page.url();
            
            if (!currentUrl.includes('/mines')) {
                this.logger.info('🔄 Navigating to mines game...');
                await this.page.goto('https://bandit.camp/mines', {
                    waitUntil: 'networkidle2',
                    timeout: 15000
                });
                await this.browserUtils.delay(2000);
            }
            
            // Wait for mines game interface to load
            const selectors = this.config.get('BANDIT_SELECTORS');
            await this.page.waitForSelector(selectors.MINES_GAME_CONTAINER, { timeout: 10000 });
            
        } catch (error) {
            this.logger.error('❌ Failed to ensure mines page:', error.message);
            throw error;
        }
    }

    /**
     * Initialize bandit.camp specific features
     */
    async initializeBanditCampFeatures() {
        try {
            this.logger.info('⚙️ Initializing bandit.camp features...');
            
            // Get current balance
            await this.updateBalance();
            this.sessionStats.startBalance = this.sessionStats.currentBalance;
            
            // Initialize betting strategy
            await this.initializeBettingStrategy();
            
            // Check if smart cheating should be enabled
            this.evaluateSmartCheating();
            
            this.logger.info('✅ Bandit.camp features initialized');
            
        } catch (error) {
            this.logger.error('❌ Failed to initialize bandit.camp features:', error.message);
            // Continue execution even if some features fail to initialize
        }
    }

    /**
     * Update current balance from bandit.camp
     */
    async updateBalance() {
        try {
            const selectors = this.config.get('BANDIT_SELECTORS');
            const balanceElement = await this.page.$(selectors.BALANCE_DISPLAY);
            
            if (balanceElement) {
                const balanceText = await this.page.evaluate(el => el.textContent, balanceElement);
                const balance = parseFloat(balanceText.replace(/[^\d.-]/g, ''));
                
                if (!isNaN(balance)) {
                    this.sessionStats.currentBalance = balance;
                    this.logger.debug(`💰 Current balance: $${balance.toFixed(2)}`);
                }
            }
        } catch (error) {
            this.logger.debug('⚠️ Could not update balance:', error.message);
        }
    }

    /**
     * Initialize betting strategy
     */
    async initializeBettingStrategy() {
        try {
            this.logger.debug(`🎯 Initializing ${this.bettingStrategy} betting strategy`);
            
            // Set initial bet amount based on strategy and balance
            const balance = this.sessionStats.currentBalance;
            const protectionThreshold = this.config.get('BALANCE_PROTECTION_THRESHOLD');
            
            if (balance > 0) {
                const maxSafeBet = balance * protectionThreshold;
                this.currentBetAmount = Math.min(
                    this.config.get('INITIAL_BET_AMOUNT'),
                    maxSafeBet,
                    this.config.get('MAX_BET_AMOUNT')
                );
            }
            
            this.logger.debug(`💵 Initial bet amount: $${this.currentBetAmount.toFixed(2)}`);
            
        } catch (error) {
            this.logger.error('❌ Failed to initialize betting strategy:', error.message);
        }
    }

    /**
     * Evaluate if smart cheating should be enabled
     */
    evaluateSmartCheating() {
        const winRate = this.calculateWinRate();
        const threshold = this.config.get('WIN_RATE_THRESHOLD');
        const enableCheating = this.config.get('ENABLE_SMART_CHEATING');
        
        if (enableCheating && winRate < threshold) {
            this.smartCheatingEnabled = true;
            this.logger.info(`🎲 Smart cheating enabled (win rate: ${(winRate * 100).toFixed(1)}% < ${(threshold * 100).toFixed(1)}%)`);
        } else {
            this.smartCheatingEnabled = false;
        }
    }

    /**
     * Calculate current win rate
     */
    calculateWinRate() {
        if (this.sessionStats.gamesPlayed === 0) return 1.0;
        return this.sessionStats.wins / this.sessionStats.gamesPlayed;
    }
    
    /**
     * Main bot execution loop for bandit.camp
     */
    async mainLoop() {
        this.logger.info('🎮 Starting bandit.camp mines game loop...');
        
        try {
            // Wait for game interface to be ready
            await this.waitForGameInterface();
            
            // Main game loop
            while (this.isRunning && this.sessionStats.gamesPlayed < this.config.get('MAX_GAMES')) {
                try {
                    // Update balance before each game
                    await this.updateBalance();
                    
                    // Check balance protection
                    if (this.shouldStopForBalanceProtection()) {
                        this.logger.warn('🛡️ Stopping due to balance protection');
                        break;
                    }
                    
                    // Adjust betting strategy based on performance
                    await this.adjustBettingStrategy();
                    
                    // Play a game
                    await this.playBanditCampGame();
                    
                    // Update statistics
                    this.evaluateSmartCheating();
                    
                    // Delay between games with anti-detection
                    await this.humanLikeDelay();
                    
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
     * Wait for bandit.camp game interface to be ready
     */
    async waitForGameInterface() {
        try {
            this.logger.debug('⏳ Waiting for bandit.camp game interface...');
            
            const selectors = this.config.get('BANDIT_SELECTORS');
            
            // Wait for main game elements
            await this.page.waitForSelector(selectors.MINES_GAME_CONTAINER, { timeout: 15000 });
            await this.page.waitForSelector(selectors.BET_INPUT, { timeout: 15000 });
            await this.page.waitForSelector(selectors.MINES_COUNT_INPUT, { timeout: 15000 });
            
            this.logger.debug('✅ Game interface is ready');
            
        } catch (error) {
            this.logger.error('❌ Game interface not ready:', error.message);
            throw error;
        }
    }

    /**
     * Check if should stop for balance protection
     */
    shouldStopForBalanceProtection() {
        const currentBalance = this.sessionStats.currentBalance;
        const startBalance = this.sessionStats.startBalance;
        const threshold = this.config.get('BALANCE_PROTECTION_THRESHOLD');
        
        if (startBalance > 0 && currentBalance < startBalance * threshold) {
            this.logger.warn(`💸 Balance protection triggered: $${currentBalance.toFixed(2)} < $${(startBalance * threshold).toFixed(2)}`);
            return true;
        }
        
        return false;
    }

    /**
     * Adjust betting strategy based on performance
     */
    async adjustBettingStrategy() {
        try {
            const winRate = this.calculateWinRate();
            const streak = this.sessionStats.streak;
            const consecutiveLosses = this.sessionStats.consecutiveLosses;
            
            switch (this.bettingStrategy) {
                case 'conservative':
                    await this.applyConservativeStrategy(winRate, streak);
                    break;
                case 'aggressive':
                    await this.applyAggressiveStrategy(winRate, streak);
                    break;
                case 'adaptive':
                    await this.applyAdaptiveStrategy(winRate, streak, consecutiveLosses);
                    break;
                case 'balanced':
                    await this.applyBalancedStrategy(winRate, streak);
                    break;
            }
            
            // Ensure bet amount is within limits
            this.currentBetAmount = Math.max(
                this.config.get('MIN_BET_AMOUNT'),
                Math.min(this.currentBetAmount, this.config.get('MAX_BET_AMOUNT'))
            );
            
        } catch (error) {
            this.logger.debug('⚠️ Error adjusting betting strategy:', error.message);
        }
    }

    /**
     * Apply conservative betting strategy
     */
    async applyConservativeStrategy(winRate, streak) {
        if (streak > 0) {
            // Increase bet slightly on winning streak
            this.currentBetAmount *= this.config.get('CONSERVATIVE_MULTIPLIER');
        } else if (this.sessionStats.consecutiveLosses > 2) {
            // Decrease bet on losing streak
            this.currentBetAmount *= 0.8;
        }
    }

    /**
     * Apply aggressive betting strategy
     */
    async applyAggressiveStrategy(winRate, streak) {
        if (streak > 0) {
            // Increase bet aggressively on winning
            this.currentBetAmount *= this.config.get('AGGRESSIVE_MULTIPLIER');
        } else if (this.sessionStats.consecutiveLosses > 1) {
            // Martingale-like approach
            this.currentBetAmount *= 2.0;
        }
    }

    /**
     * Apply adaptive betting strategy
     */
    async applyAdaptiveStrategy(winRate, streak, consecutiveLosses) {
        if (winRate > 0.6) {
            // High win rate, be more aggressive
            this.currentBetAmount *= 1.8;
        } else if (winRate < 0.4) {
            // Low win rate, be conservative
            this.currentBetAmount *= 0.7;
        } else if (consecutiveLosses >= this.config.get('MAX_CONSECUTIVE_LOSSES')) {
            // Too many losses, reduce bet significantly
            this.currentBetAmount *= 0.5;
        }
    }

    /**
     * Apply balanced betting strategy
     */
    async applyBalancedStrategy(winRate, streak) {
        const multiplier = winRate > 0.5 ? 1.3 : 0.9;
        this.currentBetAmount *= multiplier;
    }

    /**
     * Human-like delay with anti-detection
     */
    async humanLikeDelay() {
        let baseDelay = this.browserUtils.randomDelay(
            this.config.get('DELAY_MIN'),
            this.config.get('DELAY_MAX')
        );
        
        if (this.config.get('HUMAN_LIKE_DELAYS')) {
            // Add variance based on recent performance
            if (this.sessionStats.consecutiveLosses > 3) {
                baseDelay *= 1.5; // Take longer breaks after losses
            }
            
            // Random additional delays occasionally
            if (Math.random() < 0.1) {
                baseDelay += this.browserUtils.randomDelay(5000, 15000);
            }
        }
        
        this.logger.info(`⏳ Waiting ${baseDelay}ms before next game...`);
        await this.browserUtils.delay(baseDelay);
        
        // Random mouse movements if enabled
        if (this.config.get('RANDOM_MOUSE_MOVEMENTS')) {
            await this.performRandomMouseMovements();
        }
    }

    /**
     * Perform random mouse movements for anti-detection
     */
    async performRandomMouseMovements() {
        try {
            const movements = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < movements; i++) {
                const x = Math.floor(Math.random() * this.config.get('VIEWPORT_WIDTH'));
                const y = Math.floor(Math.random() * this.config.get('VIEWPORT_HEIGHT'));
                
                await this.page.mouse.move(x, y, {
                    steps: Math.floor(Math.random() * 10) + 5
                });
                
                await this.browserUtils.delay(this.browserUtils.randomDelay(100, 500));
            }
        } catch (error) {
            this.logger.debug('⚠️ Random mouse movement failed:', error.message);
        }
    }
    
    /**
     * Play a single game on bandit.camp mines
     */
    async playBanditCampGame() {
        try {
            this.logger.info(`🎮 Starting game ${this.sessionStats.gamesPlayed + 1} (Bet: $${this.currentBetAmount.toFixed(2)})`);
            
            // Initialize game state
            this.currentGame = {
                gameNumber: this.sessionStats.gamesPlayed + 1,
                startTime: Date.now(),
                betAmount: this.currentBetAmount,
                minesCount: this.calculateOptimalMinesCount(),
                moves: [],
                result: null,
                profit: 0,
                usedSmartCheating: this.smartCheatingEnabled
            };
            
            // Set up the game
            await this.setupBanditCampGame();
            
            // Start the game
            await this.startBanditCampGame();
            
            // Play the game with AI or cheating
            const gameResult = await this.playGameWithStrategy();
            
            // Handle game completion
            await this.handleGameCompletion(gameResult);
            
            // Update session statistics
            this.updateSessionStats(gameResult);
            
            this.logger.info(`🏁 Game ${this.currentGame.gameNumber} completed: ${gameResult.won ? '🎉 WIN' : '💥 LOSS'} (Profit: $${gameResult.profit.toFixed(2)})`);
            
        } catch (error) {
            this.logger.error('❌ Game play failed:', error.message);
            throw error;
        }
    }

    /**
     * Calculate optimal mines count based on strategy
     */
    calculateOptimalMinesCount() {
        const minMines = this.config.get('MIN_MINES');
        const maxMines = this.config.get('MAX_MINES');
        
        // Adjust mines count based on current strategy and performance
        let minesCount = minMines;
        
        if (this.smartCheatingEnabled) {
            // Use fewer mines when cheating for higher success rate
            minesCount = Math.max(minMines, Math.floor(maxMines * 0.3));
        } else {
            const winRate = this.calculateWinRate();
            
            if (winRate > 0.7) {
                // High win rate, can take more risk
                minesCount = Math.floor(maxMines * 0.6);
            } else if (winRate > 0.5) {
                // Moderate win rate
                minesCount = Math.floor(maxMines * 0.4);
            } else {
                // Low win rate, be conservative
                minesCount = Math.floor(maxMines * 0.2);
            }
        }
        
        return Math.max(minMines, Math.min(minesCount, maxMines));
    }

    /**
     * Set up bandit.camp game parameters
     */
    async setupBanditCampGame() {
        try {
            this.logger.debug('⚙️ Setting up bandit.camp game...');
            
            const selectors = this.config.get('BANDIT_SELECTORS');
            
            // Set bet amount
            await this.setBetAmount(this.currentBetAmount);
            
            // Set mines count
            await this.setMinesCount(this.currentGame.minesCount);
            
            // Wait for setup to complete
            await this.browserUtils.delay(1000);
            
            this.logger.debug(`✅ Game setup: Bet $${this.currentBetAmount.toFixed(2)}, Mines: ${this.currentGame.minesCount}`);
            
        } catch (error) {
            this.logger.error('❌ Game setup failed:', error.message);
            throw error;
        }
    }

    /**
     * Set bet amount on bandit.camp
     */
    async setBetAmount(amount) {
        try {
            const selectors = this.config.get('BANDIT_SELECTORS');
            const betInput = await this.page.$(selectors.BET_INPUT);
            
            if (betInput) {
                await betInput.click({ clickCount: 3 }); // Select all text
                await betInput.type(amount.toFixed(2), { delay: 100 });
                await this.browserUtils.delay(500);
            } else {
                throw new Error('Bet input not found');
            }
        } catch (error) {
            this.logger.error('❌ Failed to set bet amount:', error.message);
            throw error;
        }
    }

    /**
     * Set mines count on bandit.camp
     */
    async setMinesCount(count) {
        try {
            const selectors = this.config.get('BANDIT_SELECTORS');
            const minesInput = await this.page.$(selectors.MINES_COUNT_INPUT);
            
            if (minesInput) {
                await minesInput.click({ clickCount: 3 }); // Select all text
                await minesInput.type(count.toString(), { delay: 100 });
                await this.browserUtils.delay(500);
            } else {
                throw new Error('Mines count input not found');
            }
        } catch (error) {
            this.logger.error('❌ Failed to set mines count:', error.message);
            throw error;
        }
    }

    /**
     * Start bandit.camp game
     */
    async startBanditCampGame() {
        try {
            this.logger.debug('🚀 Starting bandit.camp game...');
            
            const selectors = this.config.get('BANDIT_SELECTORS');
            const startButton = await this.page.$(selectors.START_GAME_BUTTON);
            
            if (startButton) {
                await startButton.click();
                await this.browserUtils.delay(2000);
                
                // Wait for game grid to be active
                await this.page.waitForSelector(selectors.GAME_ACTIVE, { timeout: 10000 });
                
                this.logger.debug('✅ Game started successfully');
            } else {
                throw new Error('Start game button not found');
            }
        } catch (error) {
            this.logger.error('❌ Failed to start game:', error.message);
            throw error;
        }
    }

    /**
     * Play game with selected strategy (AI or cheating)
     */
    async playGameWithStrategy() {
        try {
            if (this.smartCheatingEnabled) {
                this.logger.debug('🎲 Playing with smart cheating enabled');
                return await this.playWithSmartCheating();
            } else {
                this.logger.debug('🧠 Playing with AI strategy');
                return await this.playWithAIStrategy();
            }
        } catch (error) {
            this.logger.error('❌ Strategy play failed:', error.message);
            throw error;
        }
    }

    /**
     * Play with smart cheating mechanisms
     */
    async playWithSmartCheating() {
        try {
            this.logger.debug('🎯 Implementing smart cheating strategy...');
            
            // Get game state with enhanced detection
            const gameState = await this.detectBanditCampGameState();
            
            if (!gameState) {
                throw new Error('Could not detect game state');
            }
            
            const confidenceLevel = this.config.get('CHEATING_CONFIDENCE_LEVEL');
            let safeMoves = 0;
            const targetSafeMoves = Math.max(3, Math.floor(Math.random() * 6) + 2); // 3-7 safe moves
            
            while (safeMoves < targetSafeMoves && gameState.gameStatus === 'playing') {
                // Use enhanced AI with cheating algorithms
                const bestMove = await this.gameAnalyzer.findSafestMoveWithCheating(gameState, confidenceLevel);
                
                if (!bestMove) {
                    this.logger.debug('🛑 No safe moves found, cashing out');
                    break;
                }
                
                // Execute the move
                await this.executeBanditCampMove(bestMove);
                
                // Wait and update game state
                await this.browserUtils.delay(this.browserUtils.randomDelay(1000, 2000));
                
                // Check if game is still active
                const updatedState = await this.detectBanditCampGameState();
                if (updatedState.gameStatus !== 'playing') {
                    break;
                }
                
                safeMoves++;
                
                // Random chance to cash out early with profit
                if (safeMoves >= 3 && Math.random() < 0.3) {
                    this.logger.debug('💰 Cashing out early with profit');
                    break;
                }
            }
            
            // Cash out if still playing
            if (gameState.gameStatus === 'playing') {
                await this.cashOutGame();
            }
            
            // Get final game result
            return await this.getFinalGameResult();
            
        } catch (error) {
            this.logger.error('❌ Smart cheating failed:', error.message);
            throw error;
        }
    }

    /**
     * Play with AI strategy (no cheating)
     */
    async playWithAIStrategy() {
        try {
            this.logger.debug('🤖 Playing with advanced AI strategy...');
            
            let gameState = await this.detectBanditCampGameState();
            let moveCount = 0;
            const maxMoves = 8; // Conservative play
            
            while (gameState && gameState.gameStatus === 'playing' && moveCount < maxMoves) {
                // Use game analyzer to find best move
                const bestMove = await this.gameAnalyzer.analyzeGameState(gameState);
                
                if (!bestMove || bestMove.safetyScore < 0.6) {
                    this.logger.debug('🛑 Safety threshold not met, cashing out');
                    break;
                }
                
                // Execute the move
                await this.executeBanditCampMove(bestMove);
                
                // Wait and update game state
                await this.browserUtils.delay(this.browserUtils.randomDelay(1500, 2500));
                
                // Update game state
                gameState = await this.detectBanditCampGameState();
                moveCount++;
                
                // Auto cash out based on multiplier
                const currentMultiplier = await this.getCurrentMultiplier();
                const targetMultiplier = this.config.get('CASHOUT_MULTIPLIER');
                
                if (currentMultiplier >= targetMultiplier) {
                    this.logger.debug(`💰 Target multiplier reached: ${currentMultiplier}x`);
                    break;
                }
            }
            
            // Cash out if still playing
            if (gameState && gameState.gameStatus === 'playing') {
                await this.cashOutGame();
            }
            
            return await this.getFinalGameResult();
            
        } catch (error) {
            this.logger.error('❌ AI strategy failed:', error.message);
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
     * Detect bandit.camp specific game state
     */
    async detectBanditCampGameState() {
        try {
            this.logger.debug('🔍 Detecting bandit.camp game state...');
            
            const selectors = this.config.get('BANDIT_SELECTORS');
            
            // Detect game status
            let gameStatus = 'playing';
            
            if (await this.browserUtils.elementExists(selectors.GAME_WON)) {
                gameStatus = 'won';
            } else if (await this.browserUtils.elementExists(selectors.GAME_LOST)) {
                gameStatus = 'lost';
            } else if (!await this.browserUtils.elementExists(selectors.GAME_ACTIVE)) {
                gameStatus = 'inactive';
            }
            
            // Get game grid
            const grid = await this.parseBanditCampGrid();
            
            return {
                grid: grid,
                gameStatus: gameStatus,
                mines: this.currentGame ? this.currentGame.minesCount : 5,
                revealed: grid ? this.countRevealedCells(grid) : 0,
                multiplier: await this.getCurrentMultiplier()
            };
            
        } catch (error) {
            this.logger.error('❌ Game state detection failed:', error.message);
            return null;
        }
    }

    /**
     * Parse bandit.camp mine grid
     */
    async parseBanditCampGrid() {
        try {
            const selectors = this.config.get('BANDIT_SELECTORS');
            const cells = await this.page.$$(selectors.MINE_CELL);
            
            if (cells.length === 0) {
                return null;
            }
            
            // Determine grid size (common sizes: 5x5 = 25 cells)
            const totalCells = cells.length;
            const gridSize = Math.sqrt(totalCells);
            
            if (gridSize % 1 !== 0) {
                this.logger.warn(`Unexpected grid size: ${totalCells} cells`);
                return null;
            }
            
            const grid = [];
            
            for (let i = 0; i < cells.length; i++) {
                const row = Math.floor(i / gridSize);
                const col = i % gridSize;
                
                if (!grid[row]) {
                    grid[row] = [];
                }
                
                // Analyze cell state
                const cellData = await this.page.evaluate(el => ({
                    isRevealed: el.classList.contains('revealed') || el.classList.contains('opened') || el.classList.contains('safe'),
                    isMine: el.classList.contains('mine') || el.classList.contains('bomb'),
                    isSafe: el.classList.contains('safe') || el.classList.contains('gem'),
                    isClickable: !el.classList.contains('disabled') && !el.classList.contains('revealed'),
                    text: el.textContent.trim(),
                    className: el.className
                }), cells[i]);
                
                grid[row][col] = {
                    x: col,
                    y: row,
                    isRevealed: cellData.isRevealed,
                    isMine: cellData.isMine,
                    isSafe: cellData.isSafe,
                    isClickable: cellData.isClickable,
                    element: cells[i]
                };
            }
            
            return grid;
            
        } catch (error) {
            this.logger.error('❌ Grid parsing failed:', error.message);
            return null;
        }
    }

    /**
     * Execute move on bandit.camp
     */
    async executeBanditCampMove(move) {
        try {
            this.logger.debug(`🎯 Executing move: (${move.x}, ${move.y})`);
            
            const grid = await this.parseBanditCampGrid();
            if (!grid || !grid[move.y] || !grid[move.y][move.x]) {
                throw new Error('Invalid move coordinates');
            }
            
            const cell = grid[move.y][move.x];
            
            if (!cell.isClickable) {
                throw new Error('Cell is not clickable');
            }
            
            // Click the cell
            if (cell.element) {
                await cell.element.click();
                
                // Record the move
                this.currentGame.moves.push({
                    ...move,
                    timestamp: Date.now()
                });
                
                this.logger.debug(`✅ Move executed: (${move.x}, ${move.y})`);
            } else {
                throw new Error('Cell element not found');
            }
            
        } catch (error) {
            this.logger.error('❌ Failed to execute bandit.camp move:', error.message);
            throw error;
        }
    }

    /**
     * Get current multiplier from bandit.camp
     */
    async getCurrentMultiplier() {
        try {
            const selectors = this.config.get('BANDIT_SELECTORS');
            const multiplierElement = await this.page.$(selectors.MULTIPLIER_DISPLAY);
            
            if (multiplierElement) {
                const multiplierText = await this.page.evaluate(el => el.textContent, multiplierElement);
                const multiplier = parseFloat(multiplierText.replace(/[^\d.-]/g, ''));
                
                if (!isNaN(multiplier)) {
                    return multiplier;
                }
            }
            
            return 1.0; // Default multiplier
            
        } catch (error) {
            this.logger.debug('⚠️ Could not get multiplier:', error.message);
            return 1.0;
        }
    }

    /**
     * Cash out current game
     */
    async cashOutGame() {
        try {
            this.logger.debug('💰 Cashing out game...');
            
            const selectors = this.config.get('BANDIT_SELECTORS');
            const cashoutButton = await this.page.$(selectors.CASHOUT_BUTTON);
            
            if (cashoutButton) {
                await cashoutButton.click();
                await this.browserUtils.delay(2000);
                this.logger.debug('✅ Cash out successful');
            } else {
                this.logger.warn('⚠️ Cash out button not found');
            }
            
        } catch (error) {
            this.logger.error('❌ Cash out failed:', error.message);
            throw error;
        }
    }

    /**
     * Get final game result from bandit.camp
     */
    async getFinalGameResult() {
        try {
            await this.browserUtils.delay(3000); // Wait for results to settle
            
            const selectors = this.config.get('BANDIT_SELECTORS');
            
            // Determine if game was won or lost
            const won = await this.browserUtils.elementExists(selectors.GAME_WON);
            const lost = await this.browserUtils.elementExists(selectors.GAME_LOST);
            
            // Calculate profit/loss
            const finalMultiplier = await this.getCurrentMultiplier();
            const profit = won ? (this.currentBetAmount * finalMultiplier) - this.currentBetAmount : -this.currentBetAmount;
            
            const result = {
                won: won,
                lost: lost,
                profit: profit,
                multiplier: finalMultiplier,
                betAmount: this.currentBetAmount,
                moves: this.currentGame.moves.length,
                duration: Date.now() - this.currentGame.startTime
            };
            
            return result;
            
        } catch (error) {
            this.logger.error('❌ Failed to get game result:', error.message);
            return {
                won: false,
                lost: true,
                profit: -this.currentBetAmount,
                multiplier: 0,
                betAmount: this.currentBetAmount,
                moves: 0,
                duration: 0
            };
        }
    }

    /**
     * Handle game completion
     */
    async handleGameCompletion(gameResult) {
        try {
            // Update balance
            await this.updateBalance();
            
            // Update profit tracking
            this.sessionStats.totalProfit += gameResult.profit;
            
            // Take screenshot if configured
            if (this.config.get('TAKE_SCREENSHOT')) {
                const screenshotName = `game-${this.currentGame.gameNumber}-${gameResult.won ? 'win' : 'loss'}`;
                await this.browserUtils.takeScreenshot(screenshotName);
            }
            
            // Store game in history
            this.gameHistory.push({
                ...this.currentGame,
                result: gameResult
            });
            
            // Update betting amount based on result
            await this.updateBettingAmountBasedOnResult(gameResult);
            
        } catch (error) {
            this.logger.error('❌ Error handling game completion:', error.message);
        }
    }

    /**
     * Update betting amount based on game result
     */
    async updateBettingAmountBasedOnResult(gameResult) {
        try {
            if (gameResult.won) {
                // Reset consecutive losses
                this.sessionStats.consecutiveLosses = 0;
                
                // Increase bet slightly on win
                this.currentBetAmount *= this.config.get('BET_MULTIPLIER');
            } else {
                // Increment consecutive losses
                this.sessionStats.consecutiveLosses++;
                
                // Adjust bet based on consecutive losses
                if (this.sessionStats.consecutiveLosses >= this.config.get('MAX_CONSECUTIVE_LOSSES')) {
                    // Reset to initial bet after too many losses
                    this.currentBetAmount = this.config.get('INITIAL_BET_AMOUNT');
                    this.logger.info('🔄 Reset bet amount due to consecutive losses');
                }
            }
            
            // Ensure bet is within bounds
            this.currentBetAmount = Math.max(
                this.config.get('MIN_BET_AMOUNT'),
                Math.min(this.currentBetAmount, this.config.get('MAX_BET_AMOUNT'))
            );
            
        } catch (error) {
            this.logger.debug('⚠️ Error updating betting amount:', error.message);
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
        this.sessionStats.gamesPlayed++;
        
        if (gameResult.won) {
            this.sessionStats.wins++;
            this.sessionStats.streak++;
            this.sessionStats.bestStreak = Math.max(this.sessionStats.bestStreak, this.sessionStats.streak);
            this.sessionStats.consecutiveLosses = 0;
        } else {
            this.sessionStats.losses++;
            this.sessionStats.streak = 0;
            this.sessionStats.consecutiveLosses++;
        }
        
        // Update win rate
        this.sessionStats.winRate = this.sessionStats.gamesPlayed > 0 ? 
            this.sessionStats.wins / this.sessionStats.gamesPlayed : 0;
        
        // Update total profit
        this.sessionStats.totalProfit += gameResult.profit || 0;
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
        
        this.logger.info('\n📊 BANDIT.CAMP SESSION SUMMARY:');
        this.logger.info(`⏱️  Duration: ${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`);
        this.logger.info(`🎮 Games Played: ${this.sessionStats.gamesPlayed}`);
        this.logger.info(`🏆 Wins: ${this.sessionStats.wins}`);
        this.logger.info(`💥 Losses: ${this.sessionStats.losses}`);
        this.logger.info(`📈 Win Rate: ${winRate}%`);
        this.logger.info(`🔥 Best Streak: ${this.sessionStats.bestStreak}`);
        this.logger.info(`⚡ Current Streak: ${this.sessionStats.streak}`);
        this.logger.info(`💰 Total Profit: $${this.sessionStats.totalProfit.toFixed(2)}`);
        this.logger.info(`💵 Current Balance: $${this.sessionStats.currentBalance.toFixed(2)}`);
        this.logger.info(`📉 Consecutive Losses: ${this.sessionStats.consecutiveLosses}`);
        this.logger.info(`🎲 Smart Cheating: ${this.smartCheatingEnabled ? 'Enabled' : 'Disabled'}`);
        this.logger.info(`🎯 Strategy: ${this.bettingStrategy}`);
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