/**
 * NASDAQ 100 Futures Trading Bot
 * Advanced trading bot with news integration, confluence analysis, and machine learning
 */

const { MarketDataService } = require('./market-data');
const { NewsService } = require('./news-service');
const { TradingStrategy } = require('./trading-strategy');
const cron = require('node-cron');
const moment = require('moment-timezone');

class TradingBot {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.isRunning = false;
        
        // Initialize services
        this.marketData = new MarketDataService(config, logger);
        this.newsService = new NewsService(config, logger);
        this.strategy = new TradingStrategy(config, logger, this.marketData, this.newsService);
        
        this.sessionStats = {
            startTime: new Date(),
            tradesExecuted: 0,
            totalPnL: 0,
            currentBalance: this.config.get('ACCOUNT_BALANCE') || 100000,
            startBalance: this.config.get('ACCOUNT_BALANCE') || 100000,
            winRate: 0,
            profitFactor: 0
        };

        this.monitoringInterval = null;
        this.scheduledJobs = [];
    }

    /**
     * Start the trading bot
     */
    async start() {
        this.logger.info('🚀 Starting NASDAQ 100 Futures Trading Bot...');
        
        try {
            this.isRunning = true;

            // Initialize all services
            await this.initialize();

            // Start monitoring
            await this.startMonitoring();

            // Schedule trading sessions
            this.scheduleTradingSessions();

            this.logger.info('✅ Trading bot started successfully');
            
            // Print initial status
            this.printStatus();

            // Keep the bot running
            await this.keepAlive();

        } catch (error) {
            this.logger.error('❌ Failed to start trading bot:', error.message);
            await this.shutdown();
            throw error;
        }
    }

    /**
     * Initialize all services
     */
    async initialize() {
        this.logger.info('⚙️ Initializing trading bot services...');

        try {
            // Initialize market data service
            await this.marketData.initialize();

            // Initialize news service
            await this.newsService.initialize();

            // Initialize trading strategy
            await this.strategy.initialize();

            this.logger.info('✅ All services initialized');

        } catch (error) {
            this.logger.error('❌ Failed to initialize services:', error.message);
            throw error;
        }
    }

    /**
     * Start monitoring market and trades
     */
    async startMonitoring() {
        this.logger.info('👁️ Starting market monitoring...');

        // Monitor every 10 seconds
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.monitoringCycle();
            } catch (error) {
                this.logger.error('❌ Error in monitoring cycle:', error.message);
            }
        }, 10000);
    }

    /**
     * Main monitoring cycle
     */
    async monitoringCycle() {
        try {
            // Check if market is open
            if (!this.isMarketOpen()) {
                return;
            }

            // Monitor existing trade
            const tradeUpdate = await this.strategy.monitorTrade();
            if (tradeUpdate) {
                await this.handleTradeClose(tradeUpdate);
            }

            // Look for new trading opportunities (only if no current trade)
            if (!this.strategy.currentTrade) {
                await this.lookForTradingOpportunity();
            }

            // Update session stats periodically
            this.updateSessionStats();

        } catch (error) {
            this.logger.error('❌ Error in monitoring cycle:', error.message);
        }
    }

    /**
     * Look for trading opportunities
     */
    async lookForTradingOpportunity() {
        try {
            // Analyze market conditions
            const analysis = await this.strategy.analyzeMarketConditions();

            if (analysis.shouldTrade) {
                this.logger.info(`🎯 Trading opportunity detected: ${analysis.signal}`);
                this.logger.info(`   Confidence: ${analysis.confidence.toFixed(1)}%`);
                this.logger.info(`   Reason: ${analysis.reason}`);

                // Execute the trade
                const trade = await this.strategy.executeTrade(analysis);
                
                if (trade) {
                    this.sessionStats.tradesExecuted++;
                    this.logger.info('✅ Trade executed successfully');
                }

            } else if (analysis.signal !== 'NONE') {
                this.logger.debug(`⏸️ Trade signal present but not executed: ${analysis.reason}`);
            }

        } catch (error) {
            this.logger.error('❌ Error looking for trading opportunity:', error.message);
        }
    }

    /**
     * Handle trade close
     */
    async handleTradeClose(trade) {
        this.logger.info(`🏁 Trade closed: ${trade.result}`);
        
        // Update session stats
        this.sessionStats.totalPnL += trade.pnl;
        this.sessionStats.currentBalance += trade.pnl;

        // Send trade notification
        await this.sendTradeNotification(trade);

        // Log detailed trade outcome
        this.logTradeOutcome(trade);
    }

    /**
     * Log detailed trade outcome for learning
     */
    logTradeOutcome(trade) {
        this.logger.info('📊 TRADE OUTCOME ANALYSIS:');
        this.logger.info(`   Setup Score: ${trade.setupScore}/10`);
        this.logger.info(`   Market Conditions: ${JSON.stringify(trade.marketConditions.confluence)}`);
        this.logger.info(`   Entry Logic: ${trade.reason}`);
        this.logger.info(`   Exit Reason: ${trade.exitReason}`);
        this.logger.info(`   Hold Time: ${moment(trade.exitTimestamp).diff(trade.timestamp, 'minutes')} minutes`);
        
        // Analyze what worked and what didn't
        const analysis = this.analyzeTradeOutcome(trade);
        this.logger.info(`   Learning Points: ${analysis.learningPoints.join(', ')}`);
    }

    /**
     * Analyze trade outcome for learning
     */
    analyzeTradeOutcome(trade) {
        const learningPoints = [];

        // Analyze exit reason
        if (trade.exitReason === 'TAKE_PROFIT') {
            learningPoints.push('Setup worked as expected');
        } else if (trade.exitReason === 'STOP_LOSS') {
            learningPoints.push('Setup failed - review entry criteria');
        } else if (trade.exitReason === 'TIME_EXIT') {
            learningPoints.push('Setup needs more time to develop');
        }

        // Analyze setup score vs outcome
        if (trade.setupScore >= 7 && trade.result === 'LOSS') {
            learningPoints.push('High confidence setup failed - review confluence');
        } else if (trade.setupScore <= 5 && trade.result === 'WIN') {
            learningPoints.push('Low confidence setup succeeded - look for similar patterns');
        }

        // Analyze market conditions
        const confluence = trade.marketConditions.confluence;
        if (confluence.strength >= 4 && trade.result === 'LOSS') {
            learningPoints.push('Strong confluence failed - check for external factors');
        }

        return { learningPoints };
    }

    /**
     * Send trade notification
     */
    async sendTradeNotification(trade) {
        // In production, this could send notifications via email, Slack, etc.
        this.logger.info('📧 Trade notification sent');
    }

    /**
     * Schedule trading sessions
     */
    scheduleTradingSessions() {
        this.logger.info('📅 Scheduling trading sessions...');

        // Market open analysis (9:30 AM EST)
        const marketOpenJob = cron.schedule('30 9 * * 1-5', async () => {
            await this.performMarketOpenAnalysis();
        }, { scheduled: false, timezone: 'America/New_York' });

        // Mid-day analysis (12:00 PM EST)
        const midDayJob = cron.schedule('0 12 * * 1-5', async () => {
            await this.performMidDayAnalysis();
        }, { scheduled: false, timezone: 'America/New_York' });

        // Market close preparation (3:30 PM EST)
        const marketCloseJob = cron.schedule('30 15 * * 1-5', async () => {
            await this.prepareForMarketClose();
        }, { scheduled: false, timezone: 'America/New_York' });

        // Daily summary (5:00 PM EST)
        const dailySummaryJob = cron.schedule('0 17 * * 1-5', async () => {
            await this.generateDailySummary();
        }, { scheduled: false, timezone: 'America/New_York' });

        this.scheduledJobs = [marketOpenJob, midDayJob, marketCloseJob, dailySummaryJob];
        
        // Start all jobs
        this.scheduledJobs.forEach(job => job.start());

        this.logger.info('✅ Trading sessions scheduled');
    }

    /**
     * Perform market open analysis
     */
    async performMarketOpenAnalysis() {
        this.logger.info('🌅 Performing market open analysis...');
        
        const newsSummary = this.newsService.getNewsSummary();
        const confluence = this.marketData.analyzeConfluence();
        
        this.logger.info('📊 MARKET OPEN SUMMARY:');
        this.logger.info(`   News Events Today: ${newsSummary.upcomingCount}`);
        this.logger.info(`   News Sentiment: ${newsSummary.sentiment}`);
        this.logger.info(`   Safe to Trade: ${newsSummary.safeToTrade ? 'YES' : 'NO'}`);
        this.logger.info(`   Market Confluence: ${confluence.signal} (${confluence.strength})`);
    }

    /**
     * Perform mid-day analysis
     */
    async performMidDayAnalysis() {
        this.logger.info('🌞 Performing mid-day analysis...');
        
        const tradingSummary = this.strategy.getTradingSummary();
        
        this.logger.info('📊 MID-DAY SUMMARY:');
        this.logger.info(`   Trades Today: ${tradingSummary.currentTrade ? 1 : 0}`);
        this.logger.info(`   Current Position: ${tradingSummary.currentTrade ? tradingSummary.currentTrade.direction : 'NONE'}`);
        this.logger.info(`   Can Trade: ${tradingSummary.canTradeToday ? 'YES' : 'NO'}`);
    }

    /**
     * Prepare for market close
     */
    async prepareForMarketClose() {
        this.logger.info('🌇 Preparing for market close...');
        
        if (this.strategy.currentTrade) {
            this.logger.info('⚠️ Open position detected - will close at market close');
        }
    }

    /**
     * Generate daily summary
     */
    async generateDailySummary() {
        this.logger.info('📋 Generating daily summary...');
        
        const tradingSummary = this.strategy.getTradingSummary();
        
        this.logger.info('📊 DAILY TRADING SUMMARY:');
        this.logger.info(`   Total Trades: ${tradingSummary.totalTrades}`);
        this.logger.info(`   Win Rate: ${(tradingSummary.winRate * 100).toFixed(1)}%`);
        this.logger.info(`   Total P&L: $${tradingSummary.totalPnL.toFixed(2)}`);
        this.logger.info(`   Profit Factor: ${tradingSummary.profitFactor.toFixed(2)}`);
        
        if (tradingSummary.totalTrades > 0) {
            this.logger.info('🧠 LEARNING INSIGHTS:');
            this.logger.info(`   Consecutive Wins: ${tradingSummary.learningData.consecutiveWins}`);
            this.logger.info(`   Consecutive Losses: ${tradingSummary.learningData.consecutiveLosses}`);
            this.logger.info(`   Average Win: $${tradingSummary.learningData.avgWin.toFixed(2)}`);
            this.logger.info(`   Average Loss: $${tradingSummary.learningData.avgLoss.toFixed(2)}`);
        }
    }

    /**
     * Check if market is open
     */
    isMarketOpen() {
        const now = moment().tz('America/New_York');
        const hour = now.hour();
        const minute = now.minute();
        const day = now.day();

        // Weekend
        if (day === 0 || day === 6) return false;

        // Market hours: 9:30 AM - 4:00 PM EST
        if (hour < 9 || hour >= 16) return false;
        if (hour === 9 && minute < 30) return false;

        return true;
    }

    /**
     * Update session statistics
     */
    updateSessionStats() {
        const tradingSummary = this.strategy.getTradingSummary();
        
        this.sessionStats.winRate = tradingSummary.winRate;
        this.sessionStats.profitFactor = tradingSummary.profitFactor;
        this.sessionStats.totalPnL = tradingSummary.totalPnL;
        this.sessionStats.currentBalance = this.sessionStats.startBalance + tradingSummary.totalPnL;
    }

    /**
     * Print current status
     */
    printStatus() {
        const marketStatus = this.isMarketOpen() ? 'OPEN' : 'CLOSED';
        const tradingSummary = this.strategy.getTradingSummary();
        const newsSummary = this.newsService.getNewsSummary();
        
        this.logger.info('\n🤖 NASDAQ 100 FUTURES TRADING BOT STATUS:');
        this.logger.info(`⏰ Market Status: ${marketStatus}`);
        this.logger.info(`💰 Account Balance: $${this.sessionStats.currentBalance.toFixed(2)}`);
        this.logger.info(`📈 Total P&L: $${this.sessionStats.totalPnL.toFixed(2)}`);
        this.logger.info(`🎯 Trades Today: ${tradingSummary.currentTrade ? 1 : 0}/1`);
        this.logger.info(`📰 News Safety: ${newsSummary.safeToTrade ? 'SAFE' : 'CAUTION'}`);
        
        if (tradingSummary.currentTrade) {
            const trade = tradingSummary.currentTrade;
            const currentPrice = this.marketData.getCurrentData('nq').price;
            const unrealizedPnL = this.strategy.calculatePnL({
                ...trade,
                exitPrice: currentPrice
            });
            
            this.logger.info(`📊 Open Position: ${trade.direction} @ $${trade.entryPrice.toFixed(2)}`);
            this.logger.info(`💹 Unrealized P&L: $${unrealizedPnL.amount.toFixed(2)}`);
        }
    }

    /**
     * Keep the bot alive
     */
    async keepAlive() {
        // Print status every 5 minutes
        const statusInterval = setInterval(() => {
            if (this.isRunning) {
                this.printStatus();
            }
        }, 300000);

        // Keep process running
        process.on('SIGINT', async () => {
            clearInterval(statusInterval);
            await this.shutdown();
        });

        process.on('SIGTERM', async () => {
            clearInterval(statusInterval);
            await this.shutdown();
        });
    }

    /**
     * Shutdown the bot
     */
    async shutdown() {
        this.logger.info('🛑 Shutting down trading bot...');
        
        this.isRunning = false;

        try {
            // Stop monitoring
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
            }

            // Stop scheduled jobs
            this.scheduledJobs.forEach(job => job.stop());

            // Close any open trades (emergency)
            if (this.strategy.currentTrade) {
                const currentPrice = this.marketData.getCurrentData('nq').price;
                await this.strategy.closeTrade('SHUTDOWN', currentPrice);
            }

            // Cleanup services
            await this.marketData.cleanup();
            this.newsService.cleanup();

            // Final summary
            this.printFinalSummary();

            this.logger.info('✅ Trading bot shutdown complete');

        } catch (error) {
            this.logger.error('❌ Error during shutdown:', error.message);
        }
    }

    /**
     * Print final summary
     */
    printFinalSummary() {
        const duration = Date.now() - this.sessionStats.startTime.getTime();
        const tradingSummary = this.strategy.getTradingSummary();
        
        this.logger.info('\n📊 FINAL TRADING SESSION SUMMARY:');
        this.logger.info(`⏱️ Duration: ${Math.floor(duration / 60000)} minutes`);
        this.logger.info(`🎮 Total Trades: ${tradingSummary.totalTrades}`);
        this.logger.info(`🏆 Win Rate: ${(tradingSummary.winRate * 100).toFixed(1)}%`);
        this.logger.info(`💰 Total P&L: $${tradingSummary.totalPnL.toFixed(2)}`);
        this.logger.info(`💵 Final Balance: $${this.sessionStats.currentBalance.toFixed(2)}`);
        this.logger.info(`📈 Profit Factor: ${tradingSummary.profitFactor.toFixed(2)}`);
    }
}

module.exports = { TradingBot };