#!/usr/bin/env python3
"""
Ultimate Mine Bot - Main entry point
A bot for playing mines games on bandit.camp

Usage:
    python main.py [options]
    
Options:
    --headless          Run browser in headless mode
    --max-games N       Maximum number of games to play
    --config FILE       Use custom config file
    --help              Show this help message
"""

import asyncio
import argparse
import sys
import os
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from mine_bot import UltimateMineBot
from config import Config
import colorama
from colorama import Fore, Style

def print_banner():
    """Print the bot banner"""
    colorama.init()
    
    banner = f"""
{Fore.CYAN}╔══════════════════════════════════════════════════════════════╗
║                    {Fore.YELLOW}ULTIMATE MINE BOT{Fore.CYAN}                          ║
║                                                              ║
║              {Fore.GREEN}Automated Mining Game Bot for bandit.camp{Fore.CYAN}        ║
║                                                              ║
║  {Fore.RED}⚠️  WARNING: This bot is for educational purposes only!{Fore.CYAN}      ║
║     {Fore.RED}Gambling involves risk. Use responsibly!{Fore.CYAN}                  ║
╚══════════════════════════════════════════════════════════════╝{Style.RESET_ALL}
"""
    print(banner)

def print_config_info():
    """Print current configuration"""
    print(f"{Fore.YELLOW}Configuration:{Style.RESET_ALL}")
    print(f"  Target URL: {Config.MINES_URL}")
    print(f"  Default Bet: {Config.DEFAULT_BET_AMOUNT}")
    print(f"  Grid Size: {Config.GRID_SIZE}")
    print(f"  Mine Count: {Config.MINE_COUNT}")
    print(f"  Conservative Mode: {Config.CONSERVATIVE_MODE}")
    print(f"  Auto Cashout After: {Config.AUTO_CASHOUT_AFTER} squares")
    print(f"  Stop Loss: {Config.STOP_LOSS}")
    print(f"  Take Profit: {Config.TAKE_PROFIT}")
    print()

async def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Ultimate Mine Bot - Automated mines game player",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                    # Run with default settings
  python main.py --headless         # Run in headless mode
  python main.py --max-games 10     # Play only 10 games
  
Environment Variables:
  DEFAULT_BET_AMOUNT    Default bet amount (default: 0.01)
  MINE_COUNT           Number of mines in game (default: 3)
  GRID_SIZE            Total grid squares (default: 25)
  CONSERVATIVE_MODE    Use conservative strategy (default: True)
  USERNAME             Account username (optional)
  PASSWORD             Account password (optional)
  STOP_LOSS            Stop loss amount (default: 10.0)
  TAKE_PROFIT          Take profit amount (default: 50.0)
        """
    )
    
    parser.add_argument(
        '--headless',
        action='store_true',
        help='Run browser in headless mode (no GUI)'
    )
    
    parser.add_argument(
        '--max-games',
        type=int,
        default=None,
        help='Maximum number of games to play'
    )
    
    parser.add_argument(
        '--config',
        type=str,
        help='Path to custom config file'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simulate without actually placing bets'
    )
    
    args = parser.parse_args()
    
    # Print banner and config
    print_banner()
    print_config_info()
    
    # Check if .env file exists and remind user to configure it
    env_file = Path('.env')
    if not env_file.exists():
        print(f"{Fore.YELLOW}⚠️  No .env file found. Create one for custom configuration.{Style.RESET_ALL}")
        print(f"   Copy .env.example to .env and customize your settings.")
        print()
    
    # Initialize the bot
    bot = UltimateMineBot()
    
    try:
        print(f"{Fore.GREEN}🚀 Initializing bot...{Style.RESET_ALL}")
        
        if not await bot.initialize(headless=args.headless):
            print(f"{Fore.RED}❌ Failed to initialize bot{Style.RESET_ALL}")
            return 1
        
        print(f"{Fore.GREEN}✅ Bot initialized successfully{Style.RESET_ALL}")
        print(f"{Fore.CYAN}🎮 Starting automated gameplay...{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}   Press Ctrl+C to stop the bot at any time{Style.RESET_ALL}")
        print()
        
        # Run the bot
        await bot.run_continuous(max_games=args.max_games)
        
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}🛑 Bot stopped by user{Style.RESET_ALL}")
    except Exception as e:
        print(f"\n{Fore.RED}❌ Error: {e}{Style.RESET_ALL}")
        return 1
    finally:
        print(f"{Fore.CYAN}🧹 Cleaning up...{Style.RESET_ALL}")
        await bot.cleanup()
        print(f"{Fore.GREEN}✅ Cleanup completed{Style.RESET_ALL}")
    
    return 0

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}👋 Goodbye!{Style.RESET_ALL}")
        sys.exit(0)