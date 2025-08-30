/**
 * Market Data Service
 * Handles NASDAQ 100 futures data and ES confluence analysis
 */

const axios = require('axios');
const WebSocket = require('ws');
const moment = require('moment');

class MarketDataService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.wsConnections = new Map();
        this.marketData = {
            nq: {
                price: 0,
                volume: 0,
                high: 0,
                low: 0,
                change: 0,
                timestamp: null
            },
            es: {
                price: 0,
                volume: 0,
                high: 0,
                low: 0,
                change: 0,
                timestamp: null
            }
        };
        this.historicalData = {
            nq: [],
            es: []
        };
    }

    /**
     * Initialize market data connections
     */
    async initialize() {
        this.logger.info('📊 Initializing market data service...');
        
        try {
            // Initialize historical data
            await this.loadHistoricalData();
            
            // Start real-time data feeds
            await this.startRealTimeFeeds();
            
            this.logger.info('✅ Market data service initialized');
        } catch (error) {
            this.logger.error('❌ Failed to initialize market data service:', error.message);
            throw error;
        }
    }

    /**
     * Load historical data for analysis
     */
    async loadHistoricalData() {
        this.logger.debug('📈 Loading historical data...');
        
        try {
            // Load NQ (NASDAQ 100 futures) historical data
            const nqData = await this.fetchHistoricalData('NQ');
            this.historicalData.nq = nqData;
            
            // Load ES (E-mini S&P 500) historical data for confluence
            const esData = await this.fetchHistoricalData('ES');
            this.historicalData.es = esData;
            
            this.logger.info(`📊 Loaded ${nqData.length} NQ candles, ${esData.length} ES candles`);
        } catch (error) {
            this.logger.error('❌ Failed to load historical data:', error.message);
            // Use mock data for development
            this.loadMockHistoricalData();
        }
    }

    /**
     * Fetch historical data from API
     */
    async fetchHistoricalData(symbol) {
        // This would connect to a real financial data provider
        // For now, we'll simulate with mock data
        return this.generateMockData(symbol, 500); // 500 candles
    }

    /**
     * Generate mock historical data for development
     */
    generateMockData(symbol, count) {
        const data = [];
        let basePrice = symbol === 'NQ' ? 15000 : 4500;
        
        for (let i = 0; i < count; i++) {
            const timestamp = moment().subtract(count - i, 'minutes').valueOf();
            const volatility = symbol === 'NQ' ? 50 : 20;
            
            const change = (Math.random() - 0.5) * volatility;
            basePrice += change;
            
            const high = basePrice + Math.random() * 10;
            const low = basePrice - Math.random() * 10;
            
            data.push({
                timestamp,
                open: basePrice - change,
                high: Math.max(high, basePrice),
                low: Math.min(low, basePrice),
                close: basePrice,
                volume: Math.floor(Math.random() * 10000) + 1000
            });
        }
        
        return data;
    }

    /**
     * Load mock historical data as fallback
     */
    loadMockHistoricalData() {
        this.logger.warn('⚠️ Using mock historical data for development');
        this.historicalData.nq = this.generateMockData('NQ', 500);
        this.historicalData.es = this.generateMockData('ES', 500);
    }

    /**
     * Start real-time market data feeds
     */
    async startRealTimeFeeds() {
        this.logger.debug('🔄 Starting real-time data feeds...');
        
        // For development, we'll simulate real-time data
        this.startMockRealTimeData();
    }

    /**
     * Start mock real-time data for development
     */
    startMockRealTimeData() {
        setInterval(() => {
            this.updateMockRealTimeData('nq');
            this.updateMockRealTimeData('es');
        }, 1000); // Update every second
    }

    /**
     * Update mock real-time data
     */
    updateMockRealTimeData(symbol) {
        const current = this.marketData[symbol];
        const volatility = symbol === 'nq' ? 2 : 1;
        const change = (Math.random() - 0.5) * volatility;
        
        this.marketData[symbol] = {
            price: current.price + change || (symbol === 'nq' ? 15000 : 4500),
            volume: Math.floor(Math.random() * 1000) + 100,
            high: Math.max(current.high || current.price, current.price + change),
            low: Math.min(current.low || current.price, current.price + change),
            change: change,
            timestamp: Date.now()
        };
    }

    /**
     * Get current market data
     */
    getCurrentData(symbol = 'nq') {
        return this.marketData[symbol.toLowerCase()];
    }

    /**
     * Get historical data
     */
    getHistoricalData(symbol = 'nq', count = 100) {
        const data = this.historicalData[symbol.toLowerCase()] || [];
        return data.slice(-count);
    }

    /**
     * Calculate technical indicators
     */
    calculateIndicators(symbol = 'nq') {
        const data = this.getHistoricalData(symbol, 50);
        if (data.length < 20) return null;

        const prices = data.map(d => d.close);
        
        return {
            sma20: this.calculateSMA(prices, 20),
            sma50: this.calculateSMA(prices, 50),
            rsi: this.calculateRSI(prices, 14),
            volume: data.slice(-10).reduce((sum, d) => sum + d.volume, 0) / 10
        };
    }

    /**
     * Calculate Simple Moving Average
     */
    calculateSMA(prices, period) {
        if (prices.length < period) return null;
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }

    /**
     * Calculate RSI
     */
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;
        
        let gains = 0;
        let losses = 0;
        
        for (let i = prices.length - period; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) {
                gains += change;
            } else {
                losses -= change;
            }
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    /**
     * Analyze market confluence between NQ and ES
     */
    analyzeConfluence() {
        const nqIndicators = this.calculateIndicators('nq');
        const esIndicators = this.calculateIndicators('es');
        
        if (!nqIndicators || !esIndicators) {
            return { signal: 'NEUTRAL', strength: 0, reason: 'Insufficient data' };
        }

        const nqTrend = this.getTrend(nqIndicators);
        const esTrend = this.getTrend(esIndicators);
        
        let confluenceScore = 0;
        let signals = [];

        // Check trend alignment
        if (nqTrend === esTrend) {
            confluenceScore += 3;
            signals.push(`Trend alignment: ${nqTrend}`);
        }

        // Check RSI levels
        if (nqIndicators.rsi > 70 && esIndicators.rsi > 70) {
            confluenceScore -= 2;
            signals.push('Both overbought');
        } else if (nqIndicators.rsi < 30 && esIndicators.rsi < 30) {
            confluenceScore += 2;
            signals.push('Both oversold');
        }

        // Determine signal
        let signal = 'NEUTRAL';
        if (confluenceScore >= 3) signal = 'BULLISH';
        else if (confluenceScore <= -2) signal = 'BEARISH';

        return {
            signal,
            strength: Math.abs(confluenceScore),
            reason: signals.join(', '),
            nqTrend,
            esTrend,
            score: confluenceScore
        };
    }

    /**
     * Get trend from indicators
     */
    getTrend(indicators) {
        if (indicators.sma20 > indicators.sma50) return 'BULLISH';
        if (indicators.sma20 < indicators.sma50) return 'BEARISH';
        return 'NEUTRAL';
    }

    /**
     * Cleanup connections
     */
    async cleanup() {
        this.logger.info('🧹 Cleaning up market data service...');
        
        for (const [symbol, ws] of this.wsConnections) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }
        
        this.wsConnections.clear();
    }
}

module.exports = { MarketDataService };