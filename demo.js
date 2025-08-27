#!/usr/bin/env node

/**
 * Demo script showing console commands
 * Run this to see example usage without connecting to a real site
 */

console.log('🎮 Ultimate Mine Bot - Console Commands Demo');
console.log('==========================================\n');

console.log('📋 Available Console Commands:');
console.log('');

console.log('🔍 ANALYSIS COMMANDS:');
console.log('  bot.analyzeProbabilities()  - Show mine probability for each cell');
console.log('  bot.getGameState()         - Display current game statistics');
console.log('  analyze()                  - Shortcut for analyzeProbabilities()');
console.log('');

console.log('🎯 AUTOMATED MOVES:');
console.log('  bot.autoFlag()             - Auto-flag cells that are obviously mines');
console.log('  bot.revealSafe()           - Reveal cells that are obviously safe');
console.log('  flag()                     - Shortcut for autoFlag()');
console.log('  reveal()                   - Shortcut for revealSafe()');
console.log('');

console.log('💀 CHEAT MODE (USE RESPONSIBLY):');
console.log('  bot.revealSafeCells()      - Reveal ALL safe cells instantly');
console.log('  cheat()                    - Shortcut for revealSafeCells()');
console.log('');

console.log('🔧 MANUAL CONTROL:');
console.log('  bot.getAllCells()          - Get array of all game cells');
console.log('  bot.clickCell(cell)        - Click a specific cell');
console.log('  bot.flagCell(cell)         - Flag a specific cell');
console.log('');

console.log('📊 EXAMPLE USAGE IN BROWSER CONSOLE:');
console.log('');
console.log('// Step 1: Analyze the board');
console.log('> analyze()');
console.log('// Shows probability table and highlights safest cells');
console.log('');

console.log('// Step 2: Make safe moves');
console.log('> flag()     // Flag obvious mines');
console.log('> reveal()   // Reveal obvious safe cells');
console.log('');

console.log('// Step 3: Check progress');
console.log('> bot.getGameState()');
console.log('// { totalCells: 100, revealed: 45, flagged: 12, hidden: 43, progress: "45.0%" }');
console.log('');

console.log('// Step 4: Get specific cells');
console.log('> const cells = bot.getAllCells()');
console.log('> const corner = cells.find(c => bot.getCellX(c) === 0 && bot.getCellY(c) === 0)');
console.log('> bot.clickCell(corner)');
console.log('');

console.log('// CHEAT MODE (educational purposes only):');
console.log('> cheat()   // Reveals all safe cells instantly');
console.log('');

console.log('⚠️  IMPORTANT REMINDERS:');
console.log('- This is for educational purposes only');
console.log('- Using on real gambling sites may violate terms of service');
console.log('- Could be illegal in your jurisdiction');
console.log('- May result in account bans');
console.log('');

console.log('🚀 To start the bot:');
console.log('1. Run: npm start');
console.log('2. Wait for browser to open');
console.log('3. Open browser developer console (F12)');
console.log('4. Type the commands above');
console.log('');

console.log('✅ Demo completed! Happy learning! 🎓');