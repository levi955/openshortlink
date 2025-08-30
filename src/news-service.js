/**
 * News Service
 * Handles Forex Factory news integration with red folder filtering
 */

const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');

class NewsService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.newsCache = [];
        this.lastUpdate = null;
        this.updateInterval = null;
    }

    /**
     * Initialize news service
     */
    async initialize() {
        this.logger.info('📰 Initializing news service...');
        
        try {
            // Initial news fetch
            await this.fetchNews();
            
            // Start periodic updates
            this.startPeriodicUpdates();
            
            this.logger.info('✅ News service initialized');
        } catch (error) {
            this.logger.error('❌ Failed to initialize news service:', error.message);
            // Continue with mock data for development
            this.loadMockNews();
        }
    }

    /**
     * Fetch news from Forex Factory
     */
    async fetchNews() {
        this.logger.debug('📥 Fetching news from Forex Factory...');
        
        try {
            // For development, we'll use mock news data
            // In production, this would scrape Forex Factory
            const news = await this.fetchForexFactoryNews();
            
            // Filter out red folder news (high impact)
            const filteredNews = this.filterRedFolderNews(news);
            
            this.newsCache = filteredNews;
            this.lastUpdate = moment();
            
            this.logger.info(`📰 Fetched ${filteredNews.length} relevant news items`);
            
        } catch (error) {
            this.logger.error('❌ Failed to fetch news:', error.message);
            this.loadMockNews();
        }
    }

    /**
     * Fetch news from Forex Factory website
     */
    async fetchForexFactoryNews() {
        // This would scrape the actual Forex Factory website
        // For development, we'll return mock data
        return this.generateMockNews();
    }

    /**
     * Generate mock news data for development
     */
    generateMockNews() {
        const mockNews = [
            {
                time: moment().add(2, 'hours').format('HH:mm'),
                currency: 'USD',
                impact: 'high',
                event: 'FOMC Meeting Minutes',
                actual: '',
                forecast: '',
                previous: '',
                isRedFolder: true
            },
            {
                time: moment().add(4, 'hours').format('HH:mm'),
                currency: 'USD',
                impact: 'medium',
                event: 'Unemployment Claims',
                actual: '',
                forecast: '220K',
                previous: '218K',
                isRedFolder: false
            },
            {
                time: moment().add(6, 'hours').format('HH:mm'),
                currency: 'USD',
                impact: 'low',
                event: 'Building Permits',
                actual: '',
                forecast: '1.45M',
                previous: '1.44M',
                isRedFolder: false
            },
            {
                time: moment().subtract(1, 'hour').format('HH:mm'),
                currency: 'USD',
                impact: 'high',
                event: 'GDP Quarter over Quarter',
                actual: '2.1%',
                forecast: '2.0%',
                previous: '1.9%',
                isRedFolder: true
            },
            {
                time: moment().add(8, 'hours').format('HH:mm'),
                currency: 'USD',
                impact: 'medium',
                event: 'Core PCE Price Index',
                actual: '',
                forecast: '0.2%',
                previous: '0.1%',
                isRedFolder: false
            }
        ];

        return mockNews.map(item => ({
            ...item,
            timestamp: moment().startOf('day').add(moment.duration(item.time)).valueOf(),
            date: moment().format('YYYY-MM-DD')
        }));
    }

    /**
     * Filter out red folder (high impact) news
     */
    filterRedFolderNews(newsItems) {
        return newsItems.filter(item => {
            // Remove high impact news (red folder)
            if (item.impact === 'high' || item.isRedFolder) {
                this.logger.debug(`🚫 Filtered red folder news: ${item.event}`);
                return false;
            }
            
            // Only keep USD-related news for NASDAQ futures
            if (item.currency !== 'USD') {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Load mock news for development
     */
    loadMockNews() {
        this.logger.warn('⚠️ Using mock news data for development');
        const mockNews = this.generateMockNews();
        this.newsCache = this.filterRedFolderNews(mockNews);
    }

    /**
     * Start periodic news updates
     */
    startPeriodicUpdates() {
        const updateIntervalMs = this.config.get('NEWS_UPDATE_INTERVAL') || 300000; // 5 minutes
        
        this.updateInterval = setInterval(async () => {
            try {
                await this.fetchNews();
            } catch (error) {
                this.logger.error('❌ Error updating news:', error.message);
            }
        }, updateIntervalMs);
    }

    /**
     * Get upcoming news events
     */
    getUpcomingNews(hours = 24) {
        const now = moment();
        const cutoff = moment().add(hours, 'hours');
        
        return this.newsCache.filter(item => {
            const newsTime = moment(item.timestamp);
            return newsTime.isAfter(now) && newsTime.isBefore(cutoff);
        }).sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Check if there's upcoming high impact news
     */
    hasUpcomingHighImpactNews(hours = 2) {
        const now = moment();
        const cutoff = moment().add(hours, 'hours');
        
        return this.newsCache.some(item => {
            const newsTime = moment(item.timestamp);
            return newsTime.isAfter(now) && 
                   newsTime.isBefore(cutoff) && 
                   (item.impact === 'high' || item.isRedFolder);
        });
    }

    /**
     * Get news sentiment analysis
     */
    analyzeNewsSentiment() {
        const recentNews = this.newsCache.filter(item => {
            const newsTime = moment(item.timestamp);
            return newsTime.isAfter(moment().subtract(6, 'hours'));
        });

        if (recentNews.length === 0) {
            return { sentiment: 'NEUTRAL', strength: 0, reason: 'No recent news' };
        }

        let sentimentScore = 0;
        let reasons = [];

        recentNews.forEach(item => {
            // Analyze based on actual vs forecast
            if (item.actual && item.forecast) {
                const actual = parseFloat(item.actual.replace(/[^0-9.-]/g, ''));
                const forecast = parseFloat(item.forecast.replace(/[^0-9.-]/g, ''));
                
                if (!isNaN(actual) && !isNaN(forecast)) {
                    const diff = ((actual - forecast) / forecast) * 100;
                    
                    // Positive economic indicators
                    if (item.event.toLowerCase().includes('gdp') || 
                        item.event.toLowerCase().includes('employment') ||
                        item.event.toLowerCase().includes('retail')) {
                        
                        if (diff > 5) {
                            sentimentScore += 1;
                            reasons.push(`${item.event} beat expectations`);
                        } else if (diff < -5) {
                            sentimentScore -= 1;
                            reasons.push(`${item.event} missed expectations`);
                        }
                    }
                }
            }
        });

        let sentiment = 'NEUTRAL';
        if (sentimentScore > 0) sentiment = 'POSITIVE';
        else if (sentimentScore < 0) sentiment = 'NEGATIVE';

        return {
            sentiment,
            strength: Math.abs(sentimentScore),
            reason: reasons.join(', ') || 'Mixed signals',
            newsCount: recentNews.length
        };
    }

    /**
     * Check if it's safe to trade based on news
     */
    isSafeToTrade() {
        // Check for upcoming high impact news
        if (this.hasUpcomingHighImpactNews(1)) {
            return {
                safe: false,
                reason: 'High impact news within 1 hour'
            };
        }

        // Check if we're in a news blackout period
        const now = moment();
        const hour = now.hour();
        
        // Avoid trading during major economic release times (EST)
        if ((hour >= 8 && hour <= 10) || (hour >= 14 && hour <= 16)) {
            const upcomingNews = this.getUpcomingNews(2);
            if (upcomingNews.length > 2) {
                return {
                    safe: false,
                    reason: 'Multiple news events during volatile hours'
                };
            }
        }

        return {
            safe: true,
            reason: 'No significant news conflicts'
        };
    }

    /**
     * Get news summary for logging
     */
    getNewsSummary() {
        const upcoming = this.getUpcomingNews(8);
        const sentiment = this.analyzeNewsSentiment();
        const safeToTrade = this.isSafeToTrade();

        return {
            upcomingCount: upcoming.length,
            nextEvent: upcoming[0] || null,
            sentiment: sentiment.sentiment,
            safeToTrade: safeToTrade.safe,
            reason: safeToTrade.reason
        };
    }

    /**
     * Cleanup news service
     */
    cleanup() {
        this.logger.info('🧹 Cleaning up news service...');
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

module.exports = { NewsService };