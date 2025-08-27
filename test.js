#!/usr/bin/env node

/**
 * Test the bot functionality locally
 */

const MineBot = require('./src/MineBot');
const path = require('path');

async function testBot() {
    console.log('🧪 Testing Ultimate Mine Bot...\n');

    // Test basic instantiation
    console.log('✅ Testing bot instantiation...');
    const bot = new MineBot({
        username: 'test',
        password: 'test',
        siteUrl: 'file://' + path.join(__dirname, 'test.html'),
        headless: true
    });
    console.log('   Bot created successfully');

    // Test module loading
    console.log('✅ Testing module imports...');
    const GameAnalyzer = require('./src/GameAnalyzer');
    const ConsoleInjector = require('./src/ConsoleInjector');
    
    const analyzer = new GameAnalyzer();
    const injector = new ConsoleInjector();
    
    console.log('   GameAnalyzer loaded');
    console.log('   ConsoleInjector loaded');

    // Test configuration
    console.log('✅ Testing configuration...');
    console.log(`   Username: ${bot.config.username}`);
    console.log(`   Site URL: ${bot.config.siteUrl}`);
    console.log(`   Headless: ${bot.config.headless}`);

    console.log('\n🎉 All tests passed!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Edit .env with your credentials');
    console.log('3. Run: npm start');
    console.log('4. Open browser console and use bot commands');
    console.log('\n💡 Try: npm run demo - for command examples');
}

testBot().catch(console.error);