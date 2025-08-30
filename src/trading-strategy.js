/**
 * Trading Strategy
 * Advanced trading strategies for NASDAQ 100 futures with learning capabilities
 */

const moment = require('moment');

class TradingStrategy {
    constructor(config, logger, marketData, newsService) {
        this.config = config;
        this.logger = logger;
        this.marketData = marketData;
        this.newsService = newsService;
        
        this.tradeHistory = [];
        this.currentTrade = null;
        this.learningData = {
            winRate: 0,
            profitFactor: 0,
            avgWin: 0,
            avgLoss: 0,
            consecutiveWins: 0,
            consecutiveLosses: 0,
            patterns: new Map()
        };
        
        this.dailyTradeCount = 0;
        this.lastTradeDate = null;
    }

    /**
     * Initialize trading strategy
     */
    async initialize() {
        this.logger.info('🎯 Initializing trading strategy...');
        
        try {
            // Load historical trade data
            await this.loadTradeHistory();
            
            // Calculate learning metrics
            this.updateLearningMetrics();
            
            this.logger.info('✅ Trading strategy initialized');
        } catch (error) {
            this.logger.error('❌ Failed to initialize trading strategy:', error.message);
        }
    }

    /**
     * Load historical trade data
     */
    async loadTradeHistory() {
        // In production, this would load from a database
        // For now, we'll start with empty history
        this.tradeHistory = [];
        this.logger.debug('📊 Trade history loaded');
    }

    /**
     * Analyze market conditions and determine if we should trade
     */
    async analyzeMarketConditions() {
        this.logger.debug('🔍 Analyzing market conditions...');

        try {
            // Check daily trade limit
            if (!this.canTradeToday()) {
                return {
                    shouldTrade: false,
                    reason: 'Daily trade limit reached (1 trade per day)',
                    signal: 'NONE'
                };
            }

            // Check news safety
            const newsSafety = this.newsService.isSafeToTrade();
            if (!newsSafety.safe) {
                return {
                    shouldTrade: false,
                    reason: `News conflict: ${newsSafety.reason}`,
                    signal: 'NONE'
                };
            }

            // Get market confluence
            const confluence = this.marketData.analyzeConfluence();
            
            // Get market indicators
            const nqIndicators = this.marketData.calculateIndicators('nq');
            const esIndicators = this.marketData.calculateIndicators('es');

            if (!nqIndicators || !esIndicators) {
                return {
                    shouldTrade: false,
                    reason: 'Insufficient market data',
                    signal: 'NONE'
                };
            }

            // Analyze trading setup
            const setup = this.analyzeSetup(nqIndicators, esIndicators, confluence);
            
            return setup;

        } catch (error) {
            this.logger.error('❌ Error analyzing market conditions:', error.message);
            return {
                shouldTrade: false,
                reason: 'Analysis error',
                signal: 'NONE'
            };
        }
    }

    /**
     * Analyze trading setup
     */
    analyzeSetup(nqIndicators, esIndicators, confluence) {
        let setupScore = 0;
        let signals = [];
        let direction = 'NONE';

        // Confluence analysis (weighted heavily)
        if (confluence.signal === 'BULLISH' && confluence.strength >= 3) {
            setupScore += 4;
            signals.push(`Strong bullish confluence (${confluence.reason})`);
            direction = 'LONG';
        } else if (confluence.signal === 'BEARISH' && confluence.strength >= 3) {
            setupScore += 4;
            signals.push(`Strong bearish confluence (${confluence.reason})`);
            direction = 'SHORT';
        } else if (confluence.signal !== 'NEUTRAL') {
            setupScore += 2;
            signals.push(`Weak ${confluence.signal.toLowerCase()} confluence`);
            direction = confluence.signal === 'BULLISH' ? 'LONG' : 'SHORT';
        }

        // RSI analysis
        if (nqIndicators.rsi < 30 && esIndicators.rsi < 30) {
            setupScore += 2;
            signals.push('Both markets oversold');
            if (direction === 'NONE') direction = 'LONG';
        } else if (nqIndicators.rsi > 70 && esIndicators.rsi > 70) {
            setupScore += 2;
            signals.push('Both markets overbought');
            if (direction === 'NONE') direction = 'SHORT';
        }

        // Moving average analysis
        const nqTrend = nqIndicators.sma20 > nqIndicators.sma50 ? 'BULLISH' : 'BEARISH';
        const esTrend = esIndicators.sma20 > esIndicators.sma50 ? 'BULLISH' : 'BEARISH';
        
        if (nqTrend === esTrend) {
            setupScore += 1;
            signals.push(`Trend alignment: ${nqTrend.toLowerCase()}`);
        }

        // News sentiment
        const newsSentiment = this.newsService.analyzeNewsSentiment();
        if (newsSentiment.sentiment === 'POSITIVE' && direction === 'LONG') {
            setupScore += 1;
            signals.push('Positive news sentiment');
        } else if (newsSentiment.sentiment === 'NEGATIVE' && direction === 'SHORT') {
            setupScore += 1;
            signals.push('Negative news sentiment');
        }

        // Apply learning from historical trades
        const learningBonus = this.getLearningBonus(direction, setupScore);
        setupScore += learningBonus;
        if (learningBonus !== 0) {
            signals.push(`Learning adjustment: ${learningBonus > 0 ? '+' : ''}${learningBonus}`);
        }

        // Minimum score requirement
        const minScore = this.config.get('MIN_SETUP_SCORE') || 5;
        const shouldTrade = setupScore >= minScore;

        return {
            shouldTrade,
            signal: direction,
            score: setupScore,
            reason: signals.join(', ') || 'No clear setup',
            confidence: Math.min(setupScore / 8 * 100, 100), // Convert to percentage
            indicators: {
                nq: nqIndicators,
                es: esIndicators,
                confluence
            }
        };
    }

    /**
     * Get learning bonus based on historical performance
     */
    getLearningBonus(direction, baseScore) {
        if (this.tradeHistory.length < 5) return 0;

        // Analyze similar setups from history
        const similarTrades = this.tradeHistory.filter(trade => {
            return trade.direction === direction && 
                   Math.abs(trade.setupScore - baseScore) <= 2;
        });

        if (similarTrades.length < 3) return 0;

        const winRate = similarTrades.filter(t => t.result === 'WIN').length / similarTrades.length;
        
        // Bonus/penalty based on historical performance of similar setups
        if (winRate > 0.7) return 1;
        if (winRate < 0.3) return -2;
        
        return 0;
    }

    /**
     * Execute trade
     */
    async executeTrade(setup) {
        this.logger.info(`🚀 Executing ${setup.signal} trade...`);

        try {
            const currentPrice = this.marketData.getCurrentData('nq').price;
            const positionSize = this.calculatePositionSize(setup);
            
            // Calculate stop loss and take profit
            const stopLoss = this.calculateStopLoss(currentPrice, setup.signal);
            const takeProfit = this.calculateTakeProfit(currentPrice, setup.signal);

            const trade = {
                id: Date.now(),
                timestamp: moment().valueOf(),
                date: moment().format('YYYY-MM-DD'),
                direction: setup.signal,
                entryPrice: currentPrice,
                positionSize: positionSize,
                stopLoss: stopLoss,
                takeProfit: takeProfit,
                setupScore: setup.score,
                confidence: setup.confidence,
                status: 'OPEN',
                reason: setup.reason,
                marketConditions: setup.indicators
            };

            this.currentTrade = trade;
            this.updateDailyTradeCount();

            this.logger.info(`📊 Trade Details:`);
            this.logger.info(`   Direction: ${trade.direction}`);
            this.logger.info(`   Entry: $${trade.entryPrice.toFixed(2)}`);
            this.logger.info(`   Stop Loss: $${trade.stopLoss.toFixed(2)}`);
            this.logger.info(`   Take Profit: $${trade.takeProfit.toFixed(2)}`);
            this.logger.info(`   Position Size: ${trade.positionSize}`);
            this.logger.info(`   Confidence: ${trade.confidence.toFixed(1)}%`);

            return trade;

        } catch (error) {
            this.logger.error('❌ Failed to execute trade:', error.message);
            throw error;
        }
    }

    /**
     * Monitor open trade
     */
    async monitorTrade() {
        if (!this.currentTrade || this.currentTrade.status !== 'OPEN') {
            return null;
        }

        const currentPrice = this.marketData.getCurrentData('nq').price;
        const trade = this.currentTrade;

        // Check stop loss
        if ((trade.direction === 'LONG' && currentPrice <= trade.stopLoss) ||
            (trade.direction === 'SHORT' && currentPrice >= trade.stopLoss)) {
            
            return await this.closeTrade('STOP_LOSS', currentPrice);
        }

        // Check take profit
        if ((trade.direction === 'LONG' && currentPrice >= trade.takeProfit) ||
            (trade.direction === 'SHORT' && currentPrice <= trade.takeProfit)) {
            
            return await this.closeTrade('TAKE_PROFIT', currentPrice);
        }

        // Check time-based exit (end of trading day)
        const now = moment();
        if (now.hour() >= 15 && now.minute() >= 45) { // 3:45 PM EST
            return await this.closeTrade('TIME_EXIT', currentPrice);
        }

        return null;
    }

    /**
     * Close trade
     */
    async closeTrade(reason, exitPrice) {
        if (!this.currentTrade) return null;

        const trade = this.currentTrade;
        trade.exitPrice = exitPrice;
        trade.exitReason = reason;
        trade.exitTimestamp = moment().valueOf();
        trade.status = 'CLOSED';

        // Calculate P&L
        const pnl = this.calculatePnL(trade);
        trade.pnl = pnl.amount;
        trade.pnlPercent = pnl.percent;
        trade.result = pnl.amount > 0 ? 'WIN' : 'LOSS';

        // Add to history
        this.tradeHistory.push(trade);
        this.currentTrade = null;

        // Update learning metrics
        this.updateLearningMetrics();

        // Log trade result
        this.logTradeResult(trade);

        return trade;
    }

    /**
     * Calculate position size
     */
    calculatePositionSize(setup) {
        const accountBalance = this.config.get('ACCOUNT_BALANCE') || 100000;
        const riskPercent = this.config.get('RISK_PERCENT') || 1; // 1% risk per trade
        const maxPositionSize = this.config.get('MAX_POSITION_SIZE') || 5;

        // Base position size on confidence and account balance
        const baseSize = Math.floor((accountBalance * riskPercent / 100) / 1000);
        const confidenceMultiplier = setup.confidence / 100;
        
        return Math.min(Math.max(Math.floor(baseSize * confidenceMultiplier), 1), maxPositionSize);
    }

    /**
     * Calculate stop loss
     */
    calculateStopLoss(entryPrice, direction) {
        const stopPercent = this.config.get('STOP_LOSS_PERCENT') || 0.5; // 0.5%
        const stopAmount = entryPrice * (stopPercent / 100);

        if (direction === 'LONG') {
            return entryPrice - stopAmount;
        } else {
            return entryPrice + stopAmount;
        }
    }

    /**
     * Calculate take profit
     */
    calculateTakeProfit(entryPrice, direction) {
        const profitPercent = this.config.get('TAKE_PROFIT_PERCENT') || 1.0; // 1.0%
        const profitAmount = entryPrice * (profitPercent / 100);

        if (direction === 'LONG') {
            return entryPrice + profitAmount;
        } else {
            return entryPrice - profitAmount;
        }
    }

    /**
     * Calculate P&L
     */
    calculatePnL(trade) {
        const priceDiff = trade.direction === 'LONG' 
            ? trade.exitPrice - trade.entryPrice
            : trade.entryPrice - trade.exitPrice;
        
        const amount = priceDiff * trade.positionSize * 20; // NQ multiplier
        const percent = (priceDiff / trade.entryPrice) * 100;

        return { amount, percent };
    }

    /**
     * Check if we can trade today
     */
    canTradeToday() {
        const today = moment().format('YYYY-MM-DD');
        
        if (this.lastTradeDate !== today) {
            this.dailyTradeCount = 0;
            this.lastTradeDate = today;
        }

        return this.dailyTradeCount < 1; // Only 1 trade per day
    }

    /**
     * Update daily trade count
     */
    updateDailyTradeCount() {
        const today = moment().format('YYYY-MM-DD');
        if (this.lastTradeDate !== today) {
            this.dailyTradeCount = 0;
            this.lastTradeDate = today;
        }
        this.dailyTradeCount++;
    }

    /**
     * Update learning metrics
     */
    updateLearningMetrics() {
        if (this.tradeHistory.length === 0) return;

        const wins = this.tradeHistory.filter(t => t.result === 'WIN');
        const losses = this.tradeHistory.filter(t => t.result === 'LOSS');

        this.learningData.winRate = wins.length / this.tradeHistory.length;
        this.learningData.avgWin = wins.length > 0 
            ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length 
            : 0;
        this.learningData.avgLoss = losses.length > 0 
            ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length)
            : 0;
        
        this.learningData.profitFactor = this.learningData.avgLoss > 0 
            ? this.learningData.avgWin / this.learningData.avgLoss 
            : 0;

        // Calculate consecutive streaks
        this.calculateStreaks();
    }

    /**
     * Calculate consecutive win/loss streaks
     */
    calculateStreaks() {
        if (this.tradeHistory.length === 0) return;

        let currentWinStreak = 0;
        let currentLossStreak = 0;

        // Go backwards from most recent trade
        for (let i = this.tradeHistory.length - 1; i >= 0; i--) {
            const trade = this.tradeHistory[i];
            
            if (trade.result === 'WIN') {
                if (currentLossStreak === 0) {
                    currentWinStreak++;
                } else {
                    break;
                }
            } else {
                if (currentWinStreak === 0) {
                    currentLossStreak++;
                } else {
                    break;
                }
            }
        }

        this.learningData.consecutiveWins = currentWinStreak;
        this.learningData.consecutiveLosses = currentLossStreak;
    }

    /**
     * Log trade result
     */
    logTradeResult(trade) {
        this.logger.info('📊 TRADE COMPLETED:');
        this.logger.info(`   Result: ${trade.result} (${trade.exitReason})`);
        this.logger.info(`   Entry: $${trade.entryPrice.toFixed(2)} → Exit: $${trade.exitPrice.toFixed(2)}`);
        this.logger.info(`   P&L: $${trade.pnl.toFixed(2)} (${trade.pnlPercent.toFixed(2)}%)`);
        this.logger.info(`   Duration: ${moment(trade.exitTimestamp).diff(trade.timestamp, 'minutes')} minutes`);
        
        // Log learning metrics
        this.logger.info('📈 LEARNING METRICS:');
        this.logger.info(`   Win Rate: ${(this.learningData.winRate * 100).toFixed(1)}%`);
        this.logger.info(`   Profit Factor: ${this.learningData.profitFactor.toFixed(2)}`);
        this.logger.info(`   Consecutive: ${this.learningData.consecutiveWins}W / ${this.learningData.consecutiveLosses}L`);
    }

    /**
     * Get trading summary
     */
    getTradingSummary() {
        return {
            totalTrades: this.tradeHistory.length,
            wins: this.tradeHistory.filter(t => t.result === 'WIN').length,
            losses: this.tradeHistory.filter(t => t.result === 'LOSS').length,
            winRate: this.learningData.winRate,
            profitFactor: this.learningData.profitFactor,
            totalPnL: this.tradeHistory.reduce((sum, t) => sum + t.pnl, 0),
            currentTrade: this.currentTrade,
            canTradeToday: this.canTradeToday(),
            learningData: this.learningData
        };
    }
}

module.exports = { TradingStrategy };