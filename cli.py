#!/usr/bin/env python3
"""
Ultimate Mine Bot - Command Line Interface
Provides easy-to-use CLI for running the bot
"""
import argparse
import sys
import os
from main import UltimateMineBot

def main():
    parser = argparse.ArgumentParser(
        description="Ultimate Mine Bot - Automated Minesweeper Player for bandit.camp",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cli.py --run                     # Run with default settings
  python cli.py --run --headless         # Run in headless mode
  python cli.py --run --games 5          # Play 5 games max
  python cli.py --setup                  # Interactive setup
  python cli.py --test                   # Test configuration
        """
    )
    
    # Main actions
    parser.add_argument('--run', action='store_true',
                        help='Run the bot')
    parser.add_argument('--setup', action='store_true',
                        help='Interactive setup wizard')
    parser.add_argument('--test', action='store_true',
                        help='Test configuration and connectivity')
    
    # Configuration options
    parser.add_argument('--headless', action='store_true',
                        help='Run browser in headless mode')
    parser.add_argument('--games', type=int, metavar='N',
                        help='Maximum number of games to play')
    parser.add_argument('--delay', type=float, metavar='SECONDS',
                        help='Delay between moves (seconds)')
    parser.add_argument('--cheats', action='store_true',
                        help='Enable advanced cheating strategies')
    
    # Utility options
    parser.add_argument('--stats', action='store_true',
                        help='Show previous session statistics')
    parser.add_argument('--clean', action='store_true',
                        help='Clean up temporary files and logs')
    
    args = parser.parse_args()
    
    if args.setup:
        run_setup()
    elif args.test:
        test_configuration()
    elif args.run:
        run_bot(args)
    elif args.stats:
        show_statistics()
    elif args.clean:
        clean_files()
    else:
        parser.print_help()

def run_setup():
    """Interactive setup wizard"""
    print("Ultimate Mine Bot Setup Wizard")
    print("=" * 40)
    
    # Check if .env exists
    if os.path.exists('.env'):
        print("Found existing .env file.")
        overwrite = input("Do you want to overwrite it? (y/N): ").lower()
        if overwrite != 'y':
            print("Setup cancelled.")
            return
    
    print("\nEnter your bandit.camp credentials:")
    username = input("Username: ").strip()
    password = input("Password: ").strip()
    
    if not username or not password:
        print("Error: Username and password are required!")
        return
    
    print("\nBot Configuration:")
    headless = input("Run in headless mode? (y/N): ").lower() == 'y'
    max_games = input("Maximum games per session (default: 10): ").strip()
    if not max_games.isdigit():
        max_games = "10"
    
    game_delay = input("Delay between moves in seconds (default: 1.0): ").strip()
    if not game_delay:
        game_delay = "1.0"
    
    enable_cheats = input("Enable advanced cheating strategies? (y/N): ").lower() == 'y'
    
    # Create .env file
    env_content = f"""# Bandit.camp Account Credentials
BANDIT_USERNAME={username}
BANDIT_PASSWORD={password}

# Bot Configuration
HEADLESS_MODE={headless}
GAME_DELAY={game_delay}
MAX_GAMES_PER_SESSION={max_games}
LEARNING_RATE=0.01

# Advanced Features
ENABLE_CHEATS={enable_cheats}
ENABLE_STATISTICS=True
SAVE_GAME_DATA=True
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("\nSetup complete! Configuration saved to .env")
    print("You can now run the bot with: python cli.py --run")

def test_configuration():
    """Test bot configuration and connectivity"""
    print("Testing bot configuration...")
    
    try:
        from config import Config
        config = Config()
        
        if not config.validate():
            print("❌ Configuration validation failed!")
            print("Please run setup: python cli.py --setup")
            return
        
        print("✅ Configuration is valid")
        
        # Test web driver setup
        print("Testing web driver setup...")
        from web_driver import WebDriverManager
        
        driver_manager = WebDriverManager(config)
        driver_manager.setup_driver()
        
        print("✅ Web driver setup successful")
        
        # Test site connectivity
        print("Testing site connectivity...")
        if driver_manager.navigate_to_site():
            print("✅ Site is accessible")
        else:
            print("❌ Cannot access bandit.camp")
        
        driver_manager.quit()
        print("\nConfiguration test complete!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

def run_bot(args):
    """Run the bot with specified arguments"""
    print("Starting Ultimate Mine Bot...")
    
    # Override environment variables with CLI arguments
    if args.headless:
        os.environ['HEADLESS_MODE'] = 'True'
    if args.games:
        os.environ['MAX_GAMES_PER_SESSION'] = str(args.games)
    if args.delay:
        os.environ['GAME_DELAY'] = str(args.delay)
    if args.cheats:
        os.environ['ENABLE_CHEATS'] = 'True'
    
    try:
        bot = UltimateMineBot()
        success = bot.run()
        
        if success:
            print("Bot completed successfully!")
        else:
            print("Bot encountered errors. Check logs for details.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\nBot stopped by user.")
    except Exception as e:
        print(f"Bot failed to start: {e}")
        sys.exit(1)

def show_statistics():
    """Show statistics from previous sessions"""
    print("Session Statistics")
    print("=" * 30)
    
    if not os.path.exists('game_data'):
        print("No session data found.")
        return
    
    import json
    import glob
    
    session_files = glob.glob('game_data/session_*.json')
    
    if not session_files:
        print("No session data files found.")
        return
    
    total_games = 0
    total_wins = 0
    total_moves = 0
    
    for session_file in sorted(session_files):
        try:
            with open(session_file, 'r') as f:
                data = json.load(f)
            
            session_stats = data.get('session_stats', {})
            games = session_stats.get('games_played', 0)
            wins = session_stats.get('games_won', 0)
            moves = session_stats.get('total_moves', 0)
            
            total_games += games
            total_wins += wins
            total_moves += moves
            
            win_rate = wins / max(games, 1) * 100
            print(f"{os.path.basename(session_file)}: {games} games, {wins} wins ({win_rate:.1f}%)")
            
        except Exception as e:
            print(f"Error reading {session_file}: {e}")
    
    if total_games > 0:
        overall_win_rate = total_wins / total_games * 100
        print(f"\nOverall: {total_games} games, {total_wins} wins ({overall_win_rate:.1f}%)")
        print(f"Total moves made: {total_moves}")

def clean_files():
    """Clean up temporary files and logs"""
    import shutil
    import glob
    
    print("Cleaning up temporary files...")
    
    # Remove screenshot directories
    if os.path.exists('screenshots'):
        shutil.rmtree('screenshots')
        print("Removed screenshots/")
    
    # Remove old log files (keep last 5)
    log_files = sorted(glob.glob('logs/*.log'))
    if len(log_files) > 5:
        for log_file in log_files[:-5]:
            os.remove(log_file)
            print(f"Removed {log_file}")
    
    # Remove cheat analysis files older than 7 days
    if os.path.exists('cheat_analysis'):
        import time
        cutoff_time = time.time() - (7 * 24 * 60 * 60)  # 7 days ago
        
        for analysis_file in glob.glob('cheat_analysis/*.json'):
            if os.path.getmtime(analysis_file) < cutoff_time:
                os.remove(analysis_file)
                print(f"Removed {analysis_file}")
    
    print("Cleanup complete!")

if __name__ == "__main__":
    main()