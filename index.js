#!/usr/bin/env node

/**
 * Ultimate Mine Bot - Main Entry Point
 * Advanced mining bot for web-based mining games
 */

require('dotenv').config();
const chalk = require('chalk');
const { TradingBot } = require('./src/trading-bot');
const { Config } = require('./src/config');
const { Logger } = require('./src/utils');

// ASCII Art Banner
const banner = `
╔══════════════════════════════════════════════════════════════╗
║                 NASDAQ 100 FUTURES TRADING BOT             ║
║              Advanced Intraday Trading Automation          ║
╚══════════════════════════════════════════════════════════════╝
`;

async function main() {
    console.log(chalk.cyan(banner));
    
    const logger = new Logger();
    const config = new Config();
    
    try {
        // Validate configuration
        await config.validate();
        
        logger.info('🚀 Starting NASDAQ 100 Futures Trading Bot...');
        logger.info(`📊 Configuration loaded: ${config.getSummary()}`);
        
        // Initialize bot
        const bot = new TradingBot(config, logger);
        
        // Setup graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('🛑 Shutdown signal received...');
            await bot.shutdown();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            logger.info('🛑 Termination signal received...');
            await bot.shutdown();
            process.exit(0);
        });
        
        // Start the bot
        await bot.start();
        
    } catch (error) {
        logger.error('❌ Fatal error:', error.message);
        if (config.get('DEBUG')) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(chalk.red('💥 Uncaught Exception:'), error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('💥 Unhandled Rejection at:'), promise, 'reason:', reason);
    process.exit(1);
});

// Run the bot
if (require.main === module) {
    main();
}

module.exports = { main };