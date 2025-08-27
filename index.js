#!/usr/bin/env node

/**
 * Ultimate Mine Bot
 * 
 * WARNING: This code is for educational purposes only. 
 * Using automation bots on gambling sites may:
 * - Violate terms of service
 * - Be illegal in your jurisdiction
 * - Result in account bans or legal consequences
 * 
 * Use at your own risk and ensure compliance with local laws.
 */

require('dotenv').config();
const MineBot = require('./src/MineBot');
const readline = require('readline-sync');

async function main() {
    console.log('🤖 Ultimate Mine Bot v1.0');
    console.log('⚠️  Educational use only - Use at your own risk');
    console.log('');

    // Check for required environment variables
    const username = process.env.USERNAME || 'prevelme12';
    const password = process.env.PASSWORD;
    const siteUrl = process.env.SITE_URL || 'https://bandit.camp/mines';

    if (!password) {
        console.log('❌ Password not set in .env file');
        const inputPassword = readline.question('Enter password: ', { hideEchoBack: true });
        process.env.PASSWORD = inputPassword;
    }

    const bot = new MineBot({
        username,
        password: process.env.PASSWORD,
        siteUrl,
        headless: process.env.HEADLESS === 'true'
    });

    try {
        console.log('🚀 Starting bot...');
        await bot.initialize();
        
        console.log('🔑 Attempting login...');
        await bot.login();
        
        console.log('🎮 Looking for minefield game...');
        await bot.findGame();
        
        console.log('🎯 Starting automated play...');
        await bot.playGame();
        
    } catch (error) {
        console.error('❌ Bot encountered an error:', error.message);
        console.log('\n📋 Manual console commands available:');
        console.log('   Use bot.revealSafeCells() in browser console');
        console.log('   Use bot.analyzeProbabilities() for strategic hints');
    } finally {
        if (readline.question('\n🔄 Keep browser open for manual control? (y/n): ').toLowerCase() !== 'y') {
            await bot.close();
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    process.exit(0);
});

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };