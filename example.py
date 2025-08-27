#!/usr/bin/env python3
"""
Ultimate Mine Bot - Quick Start Example
This is a simple example showing how to use the bot
"""

def main():
    print("🤖 Ultimate Mine Bot - Quick Start Example")
    print("=" * 50)
    
    # Check if .env exists
    import os
    if not os.path.exists('.env'):
        print("❌ No .env file found!")
        print("Please run: python cli.py --setup")
        return
    
    print("✅ Configuration file found")
    
    # Import and test configuration
    try:
        from config import Config
        config = Config()
        
        if not config.validate():
            print("❌ Configuration is invalid!")
            print("Please check your username and password in .env")
            return
        
        print(f"✅ Configuration valid for user: {config.username}")
        print(f"   Headless mode: {config.headless_mode}")
        print(f"   Max games: {config.max_games_per_session}")
        print(f"   Game delay: {config.game_delay}s")
        print(f"   Cheats enabled: {config.enable_cheats}")
        
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("Please run: pip install -r requirements.txt")
        return
    
    print("\n🎮 Starting bot demonstration...")
    print("Note: The bot will attempt to connect to bandit.camp")
    print("Press Ctrl+C to stop the bot at any time")
    
    # Import and run the bot
    try:
        from main import UltimateMineBot
        
        bot = UltimateMineBot()
        print("\n🚀 Bot initialized successfully!")
        
        # Run the bot
        success = bot.run()
        
        if success:
            print("\n✅ Bot completed successfully!")
        else:
            print("\n❌ Bot encountered errors - check logs for details")
            
    except KeyboardInterrupt:
        print("\n🛑 Bot stopped by user")
    except Exception as e:
        print(f"\n❌ Bot failed: {e}")
        print("This might be expected if bandit.camp is not accessible")
        print("The bot is designed to work when deployed in an environment with access to the target site")

if __name__ == "__main__":
    main()