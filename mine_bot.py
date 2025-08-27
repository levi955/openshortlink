"""
Main bot class that orchestrates the mines game automation
"""
import asyncio
import logging
import time
from typing import Dict, Optional
from config import Config
from web_driver import MinesWebDriver
from strategy import GameState, MinesStrategy

class UltimateMineBot:
    """Main bot class for automated mines gameplay"""
    
    def __init__(self):
        self.driver = MinesWebDriver()
        self.strategy = MinesStrategy(Config.GRID_SIZE, Config.MINE_COUNT)
        self.logger = self._setup_logging()
        
        # Bot state
        self.total_profit = 0.0
        self.games_played = 0
        self.games_won = 0
        self.games_lost = 0
        self.current_bet = Config.DEFAULT_BET_AMOUNT
        self.start_balance = 0.0
        self.running = False
        
    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logging.basicConfig(
            level=getattr(logging, Config.LOG_LEVEL),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(Config.LOG_FILE),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)
    
    async def initialize(self, headless: bool = False) -> bool:
        """Initialize the bot and browser"""
        try:
            await self.driver.start_browser(headless=headless)
            
            # Navigate to the mines game
            if not await self.driver.navigate_to_mines():
                return False
            
            # Login if credentials are provided
            if Config.USERNAME and Config.PASSWORD:
                if not await self.driver.login(Config.USERNAME, Config.PASSWORD):
                    self.logger.warning("Login failed, continuing without authentication")
            
            # Get starting balance
            self.start_balance = await self.driver.get_balance()
            self.logger.info(f"Starting balance: {self.start_balance}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize bot: {e}")
            return False
    
    async def play_single_game(self) -> Dict[str, any]:
        """
        Play a single mines game
        
        Returns:
            Dictionary with game results
        """
        game_result = {
            'won': False,
            'profit': 0.0,
            'squares_revealed': 0,
            'final_multiplier': 1.0,
            'bet_amount': self.current_bet
        }
        
        try:
            # Set bet amount
            if not await self.driver.set_bet_amount(self.current_bet):
                return game_result
            
            # Start new game
            if not await self.driver.start_new_game():
                return game_result
            
            self.logger.info(f"Starting game {self.games_played + 1} with bet {self.current_bet}")
            
            # Game loop
            game_state = GameState(Config.GRID_SIZE, Config.MINE_COUNT)
            squares_clicked = 0
            
            while squares_clicked < Config.AUTO_CASHOUT_AFTER and not await self.driver.is_game_over():
                # Get current game state
                current_state = await self.driver.get_game_state()
                game_state.revealed_squares = current_state.revealed_squares
                game_state.current_multiplier = current_state.current_multiplier
                
                # Choose next square using strategy
                next_square = self.strategy.choose_next_square(game_state, Config.CONSERVATIVE_MODE)
                
                if next_square == -1:
                    self.logger.info("No safe squares available")
                    break
                
                # Check if we should cash out before clicking
                if self.strategy.should_cash_out(game_state, 2.0):
                    self.logger.info("Strategy recommends cashing out")
                    break
                
                # Click the chosen square
                if not await self.driver.click_square(next_square):
                    break
                
                squares_clicked += 1
                game_state.revealed_squares.add(next_square)
                
                # Small delay between clicks
                await asyncio.sleep(Config.CLICK_DELAY)
                
                # Check if game ended (hit mine)
                if await self.driver.is_game_over():
                    self.logger.info("Game over - likely hit a mine")
                    game_result['squares_revealed'] = squares_clicked
                    break
            
            # If we haven't hit a mine, cash out
            if not await self.driver.is_game_over() and squares_clicked > 0:
                final_state = await self.driver.get_game_state()
                game_result['final_multiplier'] = final_state.current_multiplier
                
                if await self.driver.cash_out():
                    game_result['won'] = True
                    game_result['profit'] = self.current_bet * (final_state.current_multiplier - 1)
                    self.logger.info(f"Successfully cashed out with {final_state.current_multiplier}x multiplier")
                else:
                    self.logger.error("Failed to cash out")
            
            game_result['squares_revealed'] = squares_clicked
            
        except Exception as e:
            self.logger.error(f"Error during game: {e}")
        
        return game_result
    
    def update_betting_strategy(self, game_result: Dict[str, any]) -> None:
        """Update betting amount based on game results"""
        if game_result['won']:
            # Conservative approach - don't increase bet much on wins
            self.current_bet = min(self.current_bet * 1.1, Config.MAX_BET_AMOUNT)
        else:
            # Don't chase losses too aggressively
            self.current_bet = max(self.current_bet * 0.9, Config.MIN_BET_AMOUNT)
        
        self.logger.debug(f"Updated bet amount to {self.current_bet}")
    
    def should_stop_trading(self) -> bool:
        """Check if bot should stop based on profit/loss limits"""
        current_balance = self.start_balance + self.total_profit
        
        # Stop loss check
        if self.total_profit <= -Config.STOP_LOSS:
            self.logger.warning(f"Stop loss triggered: {self.total_profit}")
            return True
        
        # Take profit check
        if self.total_profit >= Config.TAKE_PROFIT:
            self.logger.info(f"Take profit triggered: {self.total_profit}")
            return True
        
        # Balance check
        if current_balance < self.current_bet:
            self.logger.warning("Insufficient balance for next bet")
            return True
        
        return False
    
    async def run_continuous(self, max_games: Optional[int] = None) -> None:
        """
        Run the bot continuously
        
        Args:
            max_games: Maximum number of games to play (None for unlimited)
        """
        self.running = True
        start_time = time.time()
        
        self.logger.info("Starting continuous bot operation")
        
        try:
            while self.running:
                # Check stopping conditions
                if self.should_stop_trading():
                    break
                
                if max_games and self.games_played >= max_games:
                    self.logger.info(f"Reached maximum games limit: {max_games}")
                    break
                
                # Play a game
                game_result = await self.play_single_game()
                
                # Update statistics
                self.games_played += 1
                self.total_profit += game_result['profit']
                
                if game_result['won']:
                    self.games_won += 1
                else:
                    self.games_lost += 1
                
                # Update betting strategy
                self.update_betting_strategy(game_result)
                
                # Log progress
                win_rate = (self.games_won / self.games_played) * 100 if self.games_played > 0 else 0
                self.logger.info(
                    f"Game {self.games_played}: {'WON' if game_result['won'] else 'LOST'} | "
                    f"Profit: {game_result['profit']:.4f} | "
                    f"Total: {self.total_profit:.4f} | "
                    f"Win Rate: {win_rate:.1f}%"
                )
                
                # Small delay between games
                await asyncio.sleep(2.0)
                
        except KeyboardInterrupt:
            self.logger.info("Bot stopped by user")
        except Exception as e:
            self.logger.error(f"Error during continuous operation: {e}")
        finally:
            self.running = False
            
            # Print final statistics
            runtime = time.time() - start_time
            self.print_final_stats(runtime)
    
    def print_final_stats(self, runtime: float) -> None:
        """Print final bot statistics"""
        win_rate = (self.games_won / self.games_played) * 100 if self.games_played > 0 else 0
        
        print("\n" + "="*50)
        print("ULTIMATE MINE BOT - FINAL STATISTICS")
        print("="*50)
        print(f"Runtime: {runtime:.1f} seconds")
        print(f"Games Played: {self.games_played}")
        print(f"Games Won: {self.games_won}")
        print(f"Games Lost: {self.games_lost}")
        print(f"Win Rate: {win_rate:.2f}%")
        print(f"Starting Balance: {self.start_balance:.4f}")
        print(f"Total Profit/Loss: {self.total_profit:.4f}")
        print(f"Final Balance: {self.start_balance + self.total_profit:.4f}")
        print(f"ROI: {(self.total_profit / self.start_balance) * 100:.2f}%")
        print("="*50)
    
    async def cleanup(self) -> None:
        """Clean up resources"""
        self.running = False
        await self.driver.close()
        self.logger.info("Bot cleanup completed")