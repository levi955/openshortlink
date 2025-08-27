"""
Ultimate Mine Bot - Main Bot Controller
Orchestrates the entire bot operation including login, game detection, and automated play
"""
import time
import logging
import json
import os
from typing import Dict, Any
from config import Config
from web_driver import WebDriverManager
from game_logic import MineGame
from strategy import MineStrategy

class UltimateMineBot:
    def __init__(self):
        self.config = Config()
        self.driver_manager = None
        self.game = None
        self.strategy = None
        self.logger = self.setup_logging()
        
        # Session statistics
        self.session_stats = {
            'games_played': 0,
            'games_won': 0,
            'total_moves': 0,
            'session_start_time': time.time()
        }
        
    def setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        os.makedirs('logs', exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'logs/bot_{int(time.time())}.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)
    
    def initialize(self) -> bool:
        """Initialize all bot components"""
        try:
            self.logger.info("Initializing Ultimate Mine Bot...")
            
            # Validate configuration
            if not self.config.validate():
                return False
            
            # Initialize web driver
            self.driver_manager = WebDriverManager(self.config)
            self.driver_manager.setup_driver()
            
            # Initialize game logic
            self.game = MineGame(self.driver_manager)
            
            # Initialize strategy engine
            self.strategy = MineStrategy(self.game)
            
            self.logger.info("Bot initialization complete!")
            return True
            
        except Exception as e:
            self.logger.error(f"Initialization failed: {e}")
            return False
    
    def run(self) -> bool:
        """Main bot execution loop"""
        try:
            if not self.initialize():
                return False
            
            # Navigate to site and login
            if not self.login():
                return False
            
            # Navigate to mines game
            if not self.driver_manager.navigate_to_mines():
                self.logger.error("Failed to navigate to mines game")
                return False
            
            # Take initial screenshot
            self.driver_manager.take_screenshot("initial_mines_page.png")
            
            # Main game loop
            games_played = 0
            while games_played < self.config.max_games_per_session:
                self.logger.info(f"Starting game {games_played + 1}/{self.config.max_games_per_session}")
                
                if self.play_game():
                    games_played += 1
                    self.session_stats['games_played'] += 1
                    
                    # Small delay between games
                    time.sleep(self.config.game_delay)
                else:
                    self.logger.error("Game play failed, stopping session")
                    break
            
            # Print final statistics
            self.print_session_summary()
            return True
            
        except KeyboardInterrupt:
            self.logger.info("Bot stopped by user")
            return True
        except Exception as e:
            self.logger.error(f"Bot execution failed: {e}")
            return False
        finally:
            self.cleanup()
    
    def login(self) -> bool:
        """Handle the login process"""
        try:
            # Navigate to site
            if not self.driver_manager.navigate_to_site():
                return False
            
            # Take screenshot of landing page
            self.driver_manager.take_screenshot("landing_page.png")
            
            # Attempt login
            if not self.driver_manager.login():
                self.logger.error("Login failed")
                return False
            
            # Take screenshot after login
            self.driver_manager.take_screenshot("after_login.png")
            return True
            
        except Exception as e:
            self.logger.error(f"Login process failed: {e}")
            return False
    
    def play_game(self) -> bool:
        """Play a single game of mines"""
        try:
            # Detect the game board
            if not self.game.detect_game_board():
                self.logger.error("Could not detect game board")
                return False
            
            # Analyze board layout
            if not self.game.analyze_board_layout():
                self.logger.warning("Could not determine board layout, proceeding anyway")
            
            # Take screenshot of game board
            self.driver_manager.take_screenshot(f"game_start_{self.session_stats['games_played']}.png")
            
            # Run cheat analysis if enabled
            cheat_data = {}
            if self.cheat_engine:
                self.logger.info("Running cheat analysis...")
                analysis_results = self.cheat_engine.run_comprehensive_analysis()
                cheat_data = self.cheat_engine.extract_useful_data(analysis_results)
                
                if cheat_data:
                    self.logger.info("Cheat analysis found useful data!")
                    # You could integrate this data into the strategy here
            
            move_count = 0
            max_moves = 200  # Safety limit
            
            # Make opening move
            opening_move = self.strategy.make_opening_move()
            if opening_move is not None:
                if self.game.click_tile(opening_move):
                    move_count += 1
                    self.session_stats['total_moves'] += 1
                    self.logger.info(f"Made opening move on tile {opening_move}")
                    time.sleep(1)
            
            # Main game loop
            while move_count < max_moves:
                # Check if game is over
                if self.game.is_game_over():
                    self.logger.info("Game over detected")
                    break
                
                # Choose and make next move
                next_move = self.strategy.choose_best_move()
                if next_move is None:
                    self.logger.info("No valid moves available")
                    break
                
                # Execute the move
                if self.game.click_tile(next_move):
                    move_count += 1
                    self.session_stats['total_moves'] += 1
                    self.logger.info(f"Move {move_count}: clicked tile {next_move}")
                    
                    # Update strategy statistics
                    # This is simplified - in reality we'd need to check if the move was successful
                    self.strategy.update_statistics(True)
                    
                    # Small delay between moves
                    time.sleep(0.5)
                else:
                    self.logger.error(f"Failed to click tile {next_move}")
                    break
                
                # Periodic screenshot for debugging
                if move_count % 10 == 0:
                    self.driver_manager.take_screenshot(f"game_{self.session_stats['games_played']}_move_{move_count}.png")
            
            # Check final game state
            game_won = self.check_victory()
            if game_won:
                self.session_stats['games_won'] += 1
            
            # Record game result
            self.strategy.record_game_result(game_won)
            
            # Take final screenshot
            self.driver_manager.take_screenshot(f"game_end_{self.session_stats['games_played']}.png")
            
            # Restart for next game
            if self.session_stats['games_played'] < self.config.max_games_per_session:
                self.game.restart_game()
                time.sleep(2)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error during game play: {e}")
            return False
    
    def check_victory(self) -> bool:
        """Check if the current game was won"""
        try:
            # Look for victory indicators
            page_source = self.driver_manager.driver.page_source.lower()
            victory_phrases = ["you won", "victory", "congratulations", "game complete", "success"]
            
            for phrase in victory_phrases:
                if phrase in page_source:
                    self.logger.info("Victory detected!")
                    return True
            
            # Check for visual victory indicators
            from selenium.webdriver.common.by import By
            victory_selectors = [
                ".victory",
                ".win",
                ".success",
                "[data-game-state='won']",
                ".game-won"
            ]
            
            for selector in victory_selectors:
                elements = self.driver_manager.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    self.logger.info("Victory detected via selector!")
                    return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error checking victory: {e}")
            return False
    
    def save_session_data(self):
        """Save session statistics and learning data"""
        try:
            if not self.config.save_game_data:
                return
            
            os.makedirs('game_data', exist_ok=True)
            
            # Compile session data
            session_data = {
                'session_stats': self.session_stats,
                'strategy_stats': self.strategy.get_performance_stats() if self.strategy else {},
                'config': self.config.to_dict(),
                'session_end_time': time.time()
            }
            
            # Save to file
            filename = f"game_data/session_{int(time.time())}.json"
            with open(filename, 'w') as f:
                json.dump(session_data, f, indent=2)
            
            self.logger.info(f"Session data saved to {filename}")
            
        except Exception as e:
            self.logger.error(f"Error saving session data: {e}")
    
    def print_session_summary(self):
        """Print a summary of the session"""
        duration = time.time() - self.session_stats['session_start_time']
        
        self.logger.info("=" * 50)
        self.logger.info("SESSION SUMMARY")
        self.logger.info("=" * 50)
        self.logger.info(f"Games Played: {self.session_stats['games_played']}")
        self.logger.info(f"Games Won: {self.session_stats['games_won']}")
        self.logger.info(f"Win Rate: {self.session_stats['games_won'] / max(self.session_stats['games_played'], 1):.2%}")
        self.logger.info(f"Total Moves: {self.session_stats['total_moves']}")
        self.logger.info(f"Session Duration: {duration/60:.1f} minutes")
        
        if self.strategy:
            strategy_stats = self.strategy.get_performance_stats()
            self.logger.info(f"Move Success Rate: {strategy_stats['move_success_rate']:.2%}")
        
        self.logger.info("=" * 50)
    
    def cleanup(self):
        """Clean up resources"""
        try:
            # Save session data
            self.save_session_data()
            
            # Close browser
            if self.driver_manager:
                self.driver_manager.quit()
            
            self.logger.info("Cleanup complete")
            
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")

def main():
    """Main entry point"""
    bot = UltimateMineBot()
    
    print("Ultimate Mine Bot Starting...")
    print("Make sure you have configured your credentials in the .env file!")
    print("Press Ctrl+C to stop the bot at any time.")
    
    success = bot.run()
    
    if success:
        print("Bot completed successfully!")
    else:
        print("Bot encountered errors. Check the logs for details.")

if __name__ == "__main__":
    main()