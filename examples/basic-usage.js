/**
 * Basic Usage Example for Ultimate Mine Bot
 * This example demonstrates how to use the mining bot with custom configuration
 */

const { MiningBot } = require('../src/bot');
const { Config } = require('../src/config');
const { Logger } = require('../src/utils');

async function basicExample() {
    console.log('🤖 Ultimate Mine Bot - Basic Usage Example\\n');
    
    try {
        // Create configuration with custom settings
        const config = new Config();
        
        // Override default settings for this example
        config.set('MAX_GAMES', 5);
        config.set('HEADLESS', false); // Show browser for demo
        config.set('DEBUG', true);
        config.set('TAKE_SCREENSHOT', true);
        config.set('CONSERVATIVE_MODE', true);
        
        // Create logger with custom settings
        const logger = new Logger({
            logLevel: 'info',
            saveToFile: true,
            logFile: 'logs/example.log'
        });
        
        logger.info('🚀 Starting basic example...');
        
        // Validate configuration before starting
        await config.validate();
        logger.info('✅ Configuration validated');
        
        // Create and start the bot
        const bot = new MiningBot(config, logger);
        
        // Setup graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('🛑 Example interrupted, shutting down...');
            await bot.shutdown();
            process.exit(0);
        });
        
        // Start the bot
        await bot.start();
        
        logger.info('✅ Example completed successfully');
        
    } catch (error) {
        console.error('❌ Example failed:', error.message);
        process.exit(1);
    }
}

async function advancedExample() {
    console.log('🤖 Ultimate Mine Bot - Advanced Usage Example\\n');
    
    try {
        // Advanced configuration
        const config = new Config();
        
        // Custom game strategy
        config.set('CONSERVATIVE_MODE', false);
        config.set('PROBABILITY_THRESHOLD', 0.6);
        config.set('PATTERN_LEARNING', true);
        config.set('MAX_GAMES', 20);
        
        // Performance optimization
        config.set('DELAY_MIN', 800);
        config.set('DELAY_MAX', 1500);
        config.set('CLICK_DELAY', 150);
        
        // Enhanced logging
        const logger = new Logger({
            logLevel: 'debug',
            saveToFile: true,
            logFile: 'logs/advanced-example.log'
        });
        
        logger.info('🚀 Starting advanced example with custom strategy...');
        
        // Create bot instance
        const bot = new MiningBot(config, logger);
        
        // Monitor bot performance
        let gameCount = 0;
        const startTime = Date.now();
        
        // You could add custom event handling here
        logger.info('📊 Performance monitoring enabled');
        
        // Start the bot
        await bot.start();
        
        // Calculate session performance
        const duration = Date.now() - startTime;
        logger.info(`⏱️ Session completed in ${Math.floor(duration / 1000)} seconds`);
        
    } catch (error) {
        console.error('❌ Advanced example failed:', error.message);
        process.exit(1);
    }
}

async function configurationExample() {
    console.log('🤖 Ultimate Mine Bot - Configuration Example\\n');
    
    // Example 1: Loading configuration from file
    const config1 = new Config();
    
    // Save current configuration to file
    config1.saveToFile('config/example-config.json');
    console.log('✅ Configuration saved to file');
    
    // Example 2: Custom configuration for different scenarios
    const scenarios = {
        'safe-mode': {
            CONSERVATIVE_MODE: true,
            PROBABILITY_THRESHOLD: 0.9,
            MAX_LOSS_STREAK: 2,
            DELAY_MIN: 2000,
            DELAY_MAX: 4000
        },
        'speed-mode': {
            CONSERVATIVE_MODE: false,
            PROBABILITY_THRESHOLD: 0.5,
            DELAY_MIN: 500,
            DELAY_MAX: 1000,
            CLICK_DELAY: 100
        },
        'learning-mode': {
            PATTERN_LEARNING: true,
            MEMORY_SIZE: 2000,
            MAX_GAMES: 100,
            TAKE_SCREENSHOT: true
        }
    };
    
    // Apply a scenario configuration
    const config2 = new Config();
    const selectedScenario = scenarios['safe-mode'];
    
    Object.keys(selectedScenario).forEach(key => {
        config2.set(key, selectedScenario[key]);
    });
    
    console.log('🎯 Applied safe-mode configuration:');
    console.log(config2.getSummary());
}

async function debugExample() {
    console.log('🤖 Ultimate Mine Bot - Debug Example\\n');
    
    try {
        // Debug configuration
        const config = new Config();
        config.set('DEBUG', true);
        config.set('VERBOSE_LOGGING', true);
        config.set('HEADLESS', false);
        config.set('TAKE_SCREENSHOT', true);
        config.set('MAX_GAMES', 1); // Just one game for debugging
        
        // Enhanced debug logger
        const logger = new Logger({
            logLevel: 'verbose',
            saveToFile: true,
            logFile: 'logs/debug-example.log'
        });
        
        logger.info('🐛 Starting debug session...');
        logger.debug('Debug mode: Browser window will be visible');
        logger.verbose('Verbose logging: All actions will be logged');
        
        // Create bot with debug configuration
        const bot = new MiningBot(config, logger);
        
        // You can add custom debugging logic here
        logger.info('📸 Screenshots will be saved for each game state');
        logger.info('🔍 Check logs/debug-example.log for detailed output');
        
        await bot.start();
        
    } catch (error) {
        console.error('❌ Debug example failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Console helper functions for interactive debugging
global.cheat = function() {
    console.log('🎯 Cheat mode: This would reveal optimal moves');
    console.log('(Implementation depends on current game state)');
};

global.analyze = function() {
    console.log('🧠 Analysis: Current game state analysis');
    console.log('(Check logs for detailed analysis output)');
};

global.flag = function() {
    console.log('🚩 Auto-flag: This would flag all detected mines');
    console.log('(Implementation depends on current game state)');
};

global.stats = function() {
    console.log('📊 Statistics: Current session performance');
    console.log('(Check main bot output for real-time stats)');
};

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const example = args[0] || 'basic';
    
    console.log('🎮 Available examples: basic, advanced, configuration, debug\\n');
    
    switch (example) {
        case 'basic':
            await basicExample();
            break;
        case 'advanced':
            await advancedExample();
            break;
        case 'configuration':
            await configurationExample();
            break;
        case 'debug':
            await debugExample();
            break;
        default:
            console.log('❓ Unknown example:', example);
            console.log('Usage: node examples/basic-usage.js [basic|advanced|configuration|debug]');
            process.exit(1);
    }
}

// Run example if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Example execution failed:', error);
        process.exit(1);
    });
}

module.exports = {
    basicExample,
    advancedExample,
    configurationExample,
    debugExample
};