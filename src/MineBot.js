const { chromium } = require('playwright');
const GameAnalyzer = require('./GameAnalyzer');
const ConsoleInjector = require('./ConsoleInjector');

class MineBot {
    constructor(config) {
        this.config = {
            username: 'prevelme12',
            password: '',
            siteUrl: 'https://bandit.camp/mines',
            headless: false,
            delay: 1000,
            ...config
        };
        
        this.browser = null;
        this.page = null;
        this.gameAnalyzer = new GameAnalyzer();
        this.consoleInjector = new ConsoleInjector();
    }

    async initialize() {
        console.log('🌐 Launching browser...');
        this.browser = await chromium.launch({ 
            headless: this.config.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Set user agent to avoid detection
        await this.page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        );
        
        // Navigate to site
        console.log(`📍 Navigating to ${this.config.siteUrl}...`);
        await this.page.goto(this.config.siteUrl);
        await this.page.waitForLoadState('networkidle');
    }

    async login() {
        try {
            // Look for login form elements
            console.log('🔍 Looking for login form...');
            
            // Common login selectors
            const usernameSelectors = [
                'input[name="username"]',
                'input[name="user"]',
                'input[name="email"]',
                'input[type="email"]',
                'input[placeholder*="username" i]',
                'input[placeholder*="email" i]',
                '#username',
                '#user',
                '#email'
            ];
            
            const passwordSelectors = [
                'input[name="password"]',
                'input[type="password"]',
                '#password'
            ];

            let usernameInput = null;
            let passwordInput = null;

            // Try to find username input
            for (const selector of usernameSelectors) {
                try {
                    usernameInput = await this.page.waitForSelector(selector, { timeout: 2000 });
                    if (usernameInput) {
                        console.log(`✅ Found username input: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            // Try to find password input
            for (const selector of passwordSelectors) {
                try {
                    passwordInput = await this.page.waitForSelector(selector, { timeout: 2000 });
                    if (passwordInput) {
                        console.log(`✅ Found password input: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!usernameInput || !passwordInput) {
                throw new Error('Could not find login form elements');
            }

            // Fill in credentials
            await usernameInput.fill(this.config.username);
            await passwordInput.fill(this.config.password);
            
            console.log(`📝 Filled credentials for user: ${this.config.username}`);

            // Look for submit button
            const submitSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Login")',
                'button:has-text("Sign In")',
                'button:has-text("Log In")',
                '.login-btn',
                '#login-btn'
            ];

            let submitButton = null;
            for (const selector of submitSelectors) {
                try {
                    submitButton = await this.page.waitForSelector(selector, { timeout: 2000 });
                    if (submitButton) {
                        console.log(`✅ Found submit button: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (submitButton) {
                await submitButton.click();
                console.log('🔄 Submitted login form');
            } else {
                // Try pressing Enter on password field
                await passwordInput.press('Enter');
                console.log('⌨️ Pressed Enter to submit');
            }

            // Wait for login to complete
            await this.page.waitForLoadState('networkidle');
            await this.delay(2000);

            console.log('✅ Login attempt completed');

        } catch (error) {
            console.log('⚠️ Automatic login failed:', error.message);
            console.log('💡 Manual login required - please log in manually');
            
            // Wait for manual login
            console.log('⏳ Waiting for manual login... (press Enter when done)');
            const readline = require('readline-sync');
            readline.question('Press Enter after you have logged in manually: ');
        }
    }

    async findGame() {
        console.log('🔍 Searching for minefield game...');
        
        // Common game selectors to look for
        const gameSelectors = [
            '.mine-game',
            '.minefield',
            '#mines',
            '[data-game="mines"]',
            '.game-board',
            '.mine-board',
            'canvas',
            '.grid'
        ];

        let gameFound = false;
        
        for (const selector of gameSelectors) {
            try {
                const element = await this.page.waitForSelector(selector, { timeout: 3000 });
                if (element) {
                    console.log(`🎮 Found game element: ${selector}`);
                    gameFound = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!gameFound) {
            console.log('🔍 Game not immediately visible, checking for navigation...');
            
            // Look for navigation links to mines game
            const navSelectors = [
                'a:has-text("Mines")',
                'a:has-text("Minefield")',
                'a:has-text("Mine")',
                '[href*="mine"]',
                '.nav-mines'
            ];

            for (const selector of navSelectors) {
                try {
                    const link = await this.page.waitForSelector(selector, { timeout: 2000 });
                    if (link) {
                        console.log(`🔗 Found navigation link: ${selector}`);
                        await link.click();
                        await this.page.waitForLoadState('networkidle');
                        gameFound = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        if (!gameFound) {
            throw new Error('Could not locate minefield game');
        }

        console.log('✅ Game area located');
    }

    async playGame() {
        console.log('🎯 Analyzing game board...');
        
        // Inject console helpers
        await this.consoleInjector.inject(this.page);
        
        // Start game analysis
        const gameState = await this.gameAnalyzer.analyzeBoard(this.page);
        
        if (!gameState.isValid) {
            throw new Error('Could not analyze game board');
        }

        console.log(`📊 Board dimensions: ${gameState.width}x${gameState.height}`);
        console.log(`💣 Estimated mines: ${gameState.mineCount}`);

        // Play strategy
        let moveCount = 0;
        const maxMoves = 50; // Safety limit

        while (moveCount < maxMoves) {
            try {
                console.log(`🎲 Move ${moveCount + 1}`);
                
                // Get next safe move
                const nextMove = await this.gameAnalyzer.getNextMove(this.page);
                
                if (!nextMove) {
                    console.log('🤔 No obvious safe moves detected');
                    console.log('💡 Switching to probability analysis...');
                    
                    const probabilityMove = await this.gameAnalyzer.getProbabilityMove(this.page);
                    if (probabilityMove) {
                        await this.makeMove(probabilityMove);
                    } else {
                        console.log('🎰 Making educated guess...');
                        await this.makeRandomMove();
                    }
                } else {
                    await this.makeMove(nextMove);
                }

                moveCount++;
                await this.delay(this.config.delay);

                // Check for game end
                const gameStatus = await this.checkGameStatus();
                if (gameStatus.isComplete) {
                    if (gameStatus.won) {
                        console.log('🎉 GAME WON! 🎉');
                    } else {
                        console.log('💥 Game lost...');
                    }
                    break;
                }

            } catch (error) {
                console.log('⚠️ Error during move:', error.message);
                break;
            }
        }

        console.log('🏁 Game session completed');
    }

    async makeMove(move) {
        console.log(`🎯 Making move at (${move.x}, ${move.y})`);
        
        try {
            if (move.action === 'click') {
                await this.page.click(`[data-x="${move.x}"][data-y="${move.y}"]`);
            } else if (move.action === 'flag') {
                await this.page.click(`[data-x="${move.x}"][data-y="${move.y}"]`, { button: 'right' });
            }
        } catch (error) {
            // Fallback to coordinate clicking
            await this.page.mouse.click(move.screenX || move.x * 32, move.screenY || move.y * 32);
        }
    }

    async makeRandomMove() {
        // This is where we would implement random move logic
        console.log('🎲 Random move logic not yet implemented');
    }

    async checkGameStatus() {
        // Check for game completion indicators
        try {
            const winElement = await this.page.$('.win, .victory, .success');
            if (winElement) {
                return { isComplete: true, won: true };
            }

            const loseElement = await this.page.$('.lose, .game-over, .failure');
            if (loseElement) {
                return { isComplete: true, won: false };
            }

            return { isComplete: false };
        } catch (error) {
            return { isComplete: false };
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async close() {
        if (this.browser) {
            console.log('🔒 Closing browser...');
            await this.browser.close();
        }
    }
}

module.exports = MineBot;