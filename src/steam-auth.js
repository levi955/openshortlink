/**
 * Steam Authentication Handler
 * Handles Steam OAuth flow and session management for bandit.camp
 */

class SteamAuth {
    constructor(page, logger, config) {
        this.page = page;
        this.logger = logger;
        this.config = config;
        this.isLoggedIn = false;
        this.sessionData = null;
        this.loginAttempts = 0;
        this.maxLoginAttempts = 3;
    }

    /**
     * Check if user is already logged into bandit.camp
     */
    async checkLoginStatus() {
        try {
            this.logger.debug('🔍 Checking bandit.camp login status...');
            
            const selectors = this.config.get('BANDIT_SELECTORS');
            
            // Look for user info or logged-in indicators
            const loginIndicators = [
                selectors.LOGIN_STATUS,
                selectors.BALANCE_DISPLAY,
                '.user-profile',
                '.user-menu',
                '.logout',
                '[data-testid="user-info"]'
            ];
            
            for (const selector of loginIndicators) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        this.logger.info('✅ User appears to be logged in to bandit.camp');
                        this.isLoggedIn = true;
                        return true;
                    }
                } catch (error) {
                    // Continue checking other selectors
                }
            }
            
            // Check if Steam login button is present (indicates not logged in)
            const steamLoginButton = await this.page.$(selectors.STEAM_LOGIN_BUTTON);
            if (steamLoginButton) {
                this.logger.info('🔑 Steam login required');
                this.isLoggedIn = false;
                return false;
            }
            
            // If no clear indicators, assume not logged in
            this.isLoggedIn = false;
            return false;
            
        } catch (error) {
            this.logger.error('❌ Error checking login status:', error.message);
            this.isLoggedIn = false;
            return false;
        }
    }

    /**
     * Initiate Steam login process
     */
    async initiateSteamLogin() {
        try {
            this.logger.info('🚀 Initiating Steam login process...');
            
            if (this.loginAttempts >= this.maxLoginAttempts) {
                throw new Error('Maximum login attempts exceeded');
            }
            
            this.loginAttempts++;
            
            const selectors = this.config.get('BANDIT_SELECTORS');
            const steamLoginButton = await this.page.$(selectors.STEAM_LOGIN_BUTTON);
            
            if (!steamLoginButton) {
                throw new Error('Steam login button not found');
            }
            
            // Click Steam login button
            await steamLoginButton.click();
            this.logger.debug('🔄 Clicked Steam login button');
            
            // Wait for Steam login page or popup
            await this.page.waitForTimeout(2000);
            
            // Handle Steam OAuth flow
            await this.handleSteamOAuth();
            
            // Verify login success
            await this.verifyLoginSuccess();
            
            return true;
            
        } catch (error) {
            this.logger.error('❌ Steam login failed:', error.message);
            throw error;
        }
    }

    /**
     * Handle Steam OAuth flow
     */
    async handleSteamOAuth() {
        try {
            this.logger.debug('🔐 Handling Steam OAuth flow...');
            
            // Wait for Steam login form or redirect
            await this.page.waitForTimeout(3000);
            
            // Check if we're on Steam's domain
            const currentUrl = this.page.url();
            
            if (currentUrl.includes('steamcommunity.com') || currentUrl.includes('store.steampowered.com')) {
                this.logger.debug('🌐 Redirected to Steam for authentication');
                
                // Handle Steam login form if credentials are provided
                if (this.config.get('STEAM_AUTO_LOGIN') && 
                    this.config.get('STEAM_USERNAME') && 
                    this.config.get('STEAM_PASSWORD')) {
                    await this.fillSteamCredentials();
                } else {
                    this.logger.info('⏳ Waiting for manual Steam authentication...');
                    // Wait for user to complete Steam login manually
                    await this.waitForAuthCompletion();
                }
            } else {
                // Might be a popup or iframe
                await this.handleSteamPopup();
            }
            
        } catch (error) {
            this.logger.error('❌ Steam OAuth handling failed:', error.message);
            throw error;
        }
    }

    /**
     * Fill Steam login credentials automatically
     */
    async fillSteamCredentials() {
        try {
            this.logger.debug('📝 Filling Steam credentials...');
            
            // Wait for Steam login form
            await this.page.waitForSelector('#steamAccountName', { timeout: 10000 });
            
            // Fill username
            await this.page.type('#steamAccountName', this.config.get('STEAM_USERNAME'), {
                delay: this.randomDelay(50, 150)
            });
            
            // Fill password
            await this.page.type('#steamPassword', this.config.get('STEAM_PASSWORD'), {
                delay: this.randomDelay(50, 150)
            });
            
            // Handle Steam Guard if needed
            if (this.config.get('STEAM_GUARD_CODE')) {
                const steamGuardInput = await this.page.$('#steamMobileAuthCode, #twofactorcode_entry');
                if (steamGuardInput) {
                    await this.page.type('#steamMobileAuthCode, #twofactorcode_entry', 
                        this.config.get('STEAM_GUARD_CODE'));
                }
            }
            
            // Remember login if configured
            if (this.config.get('STEAM_REMEMBER_LOGIN')) {
                const rememberCheckbox = await this.page.$('#remember_login');
                if (rememberCheckbox) {
                    await rememberCheckbox.click();
                }
            }
            
            // Submit login form
            await this.page.click('#SteamLogin');
            this.logger.debug('✅ Steam credentials submitted');
            
            // Wait for login processing
            await this.page.waitForTimeout(5000);
            
        } catch (error) {
            this.logger.error('❌ Failed to fill Steam credentials:', error.message);
            throw error;
        }
    }

    /**
     * Handle Steam popup authentication
     */
    async handleSteamPopup() {
        try {
            this.logger.debug('🪟 Handling Steam popup authentication...');
            
            // Look for popup or new window
            const pages = await this.page.browser().pages();
            let steamPage = null;
            
            for (const page of pages) {
                const url = page.url();
                if (url.includes('steamcommunity.com') || url.includes('store.steampowered.com')) {
                    steamPage = page;
                    break;
                }
            }
            
            if (steamPage) {
                this.logger.debug('🔍 Found Steam authentication page');
                
                if (this.config.get('STEAM_AUTO_LOGIN')) {
                    // Switch to Steam page and handle login
                    await this.handleSteamPageLogin(steamPage);
                } else {
                    this.logger.info('⏳ Waiting for manual Steam authentication in popup...');
                    await this.waitForPopupCompletion(steamPage);
                }
            } else {
                this.logger.warn('⚠️ Steam popup not detected, waiting for authentication...');
                await this.waitForAuthCompletion();
            }
            
        } catch (error) {
            this.logger.error('❌ Steam popup handling failed:', error.message);
            throw error;
        }
    }

    /**
     * Handle Steam login in separate page
     */
    async handleSteamPageLogin(steamPage) {
        try {
            const currentPage = this.page;
            this.page = steamPage;
            
            await this.fillSteamCredentials();
            
            // Switch back to main page
            this.page = currentPage;
            
        } catch (error) {
            this.logger.error('❌ Steam page login failed:', error.message);
            throw error;
        }
    }

    /**
     * Wait for authentication completion
     */
    async waitForAuthCompletion() {
        try {
            this.logger.info('⏳ Waiting for Steam authentication to complete...');
            
            const timeout = 120000; // 2 minutes
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
                // Check if redirected back to bandit.camp
                const currentUrl = this.page.url();
                if (currentUrl.includes('bandit.camp')) {
                    this.logger.debug('🔄 Redirected back to bandit.camp');
                    break;
                }
                
                await this.page.waitForTimeout(2000);
            }
            
            // Additional wait for page to settle
            await this.page.waitForTimeout(3000);
            
        } catch (error) {
            this.logger.error('❌ Authentication completion wait failed:', error.message);
            throw error;
        }
    }

    /**
     * Wait for popup completion
     */
    async waitForPopupCompletion(steamPage) {
        try {
            const timeout = 120000; // 2 minutes
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
                // Check if popup is closed
                if (steamPage.isClosed()) {
                    this.logger.debug('🔄 Steam popup closed');
                    break;
                }
                
                await this.page.waitForTimeout(2000);
            }
            
            // Wait for main page to update
            await this.page.waitForTimeout(3000);
            
        } catch (error) {
            this.logger.error('❌ Popup completion wait failed:', error.message);
            throw error;
        }
    }

    /**
     * Verify login success
     */
    async verifyLoginSuccess() {
        try {
            this.logger.debug('✅ Verifying login success...');
            
            // Wait for page to settle after login
            await this.page.waitForTimeout(5000);
            
            // Check login status again
            const isLoggedIn = await this.checkLoginStatus();
            
            if (isLoggedIn) {
                this.logger.info('🎉 Steam login successful!');
                this.isLoggedIn = true;
                this.loginAttempts = 0; // Reset attempts on success
                
                // Save session data if configured
                if (this.config.get('STEAM_REMEMBER_LOGIN')) {
                    await this.saveSessionData();
                }
                
                return true;
            } else {
                throw new Error('Login verification failed - user not logged in');
            }
            
        } catch (error) {
            this.logger.error('❌ Login verification failed:', error.message);
            throw error;
        }
    }

    /**
     * Save session data for persistence
     */
    async saveSessionData() {
        try {
            this.logger.debug('💾 Saving session data...');
            
            // Get cookies and local storage
            const cookies = await this.page.cookies();
            const localStorage = await this.page.evaluate(() => {
                const data = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    data[key] = localStorage.getItem(key);
                }
                return data;
            });
            
            this.sessionData = {
                cookies,
                localStorage,
                timestamp: Date.now(),
                url: this.page.url()
            };
            
            this.logger.debug('✅ Session data saved');
            
        } catch (error) {
            this.logger.error('❌ Failed to save session data:', error.message);
        }
    }

    /**
     * Restore session data
     */
    async restoreSessionData() {
        try {
            if (!this.sessionData) {
                return false;
            }
            
            this.logger.debug('🔄 Restoring session data...');
            
            // Check if session is still valid (not expired)
            const sessionAge = Date.now() - this.sessionData.timestamp;
            const sessionTimeout = this.config.get('STEAM_SESSION_TIMEOUT');
            
            if (sessionAge > sessionTimeout) {
                this.logger.debug('⏰ Session expired, discarding saved data');
                this.sessionData = null;
                return false;
            }
            
            // Restore cookies
            if (this.sessionData.cookies) {
                await this.page.setCookie(...this.sessionData.cookies);
            }
            
            // Restore local storage
            if (this.sessionData.localStorage) {
                await this.page.evaluate((data) => {
                    Object.keys(data).forEach(key => {
                        localStorage.setItem(key, data[key]);
                    });
                }, this.sessionData.localStorage);
            }
            
            this.logger.debug('✅ Session data restored');
            return true;
            
        } catch (error) {
            this.logger.error('❌ Failed to restore session data:', error.message);
            return false;
        }
    }

    /**
     * Perform complete authentication flow
     */
    async authenticate() {
        try {
            this.logger.info('🔐 Starting Steam authentication for bandit.camp...');
            
            // Try to restore previous session first
            if (this.config.get('STEAM_REMEMBER_LOGIN')) {
                const restored = await this.restoreSessionData();
                if (restored) {
                    // Refresh page to apply restored session
                    await this.page.reload({ waitUntil: 'networkidle2' });
                    await this.page.waitForTimeout(3000);
                }
            }
            
            // Check current login status
            const isLoggedIn = await this.checkLoginStatus();
            
            if (isLoggedIn) {
                this.logger.info('✅ Already authenticated with bandit.camp');
                return true;
            }
            
            // Initiate Steam login
            await this.initiateSteamLogin();
            
            this.logger.info('🎉 Steam authentication completed successfully!');
            return true;
            
        } catch (error) {
            this.logger.error('❌ Steam authentication failed:', error.message);
            throw error;
        }
    }

    /**
     * Generate random delay for human-like behavior
     */
    randomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Get current login status
     */
    getLoginStatus() {
        return this.isLoggedIn;
    }

    /**
     * Clear session data
     */
    clearSessionData() {
        this.sessionData = null;
        this.isLoggedIn = false;
        this.loginAttempts = 0;
    }
}

module.exports = { SteamAuth };