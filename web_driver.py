"""
Web automation module for interacting with bandit.camp mines game
"""
import asyncio
import logging
from typing import Optional, Dict, List
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from config import Config
from strategy import GameState, MinesStrategy

class MinesWebDriver:
    """Web driver for automating the mines game on bandit.camp"""
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.strategy = MinesStrategy()
        self.logger = logging.getLogger(__name__)
        
    async def start_browser(self, headless: bool = False) -> None:
        """Initialize the browser and create a new page"""
        playwright = await async_playwright().start()
        
        # Launch browser with appropriate settings
        self.browser = await playwright.chromium.launch(
            headless=headless,
            args=[
                '--no-sandbox',
                '--disable-bgsync',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        )
        
        # Create browser context
        self.context = await self.browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        
        # Create new page
        self.page = await self.context.new_page()
        await self.page.set_default_timeout(Config.PAGE_LOAD_TIMEOUT)
        
        self.logger.info("Browser started successfully")
    
    async def navigate_to_mines(self) -> bool:
        """Navigate to the mines game page"""
        try:
            await self.page.goto(Config.MINES_URL)
            await self.page.wait_for_load_state('domcontentloaded')
            self.logger.info(f"Navigated to {Config.MINES_URL}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to navigate to mines page: {e}")
            return False
    
    async def login(self, username: str, password: str) -> bool:
        """
        Login to the site if authentication is required
        
        Args:
            username: Account username
            password: Account password
            
        Returns:
            True if login successful, False otherwise
        """
        try:
            # Look for login form elements (these selectors would need to be updated based on actual site)
            username_field = await self.page.query_selector('input[name="username"], input[type="email"]')
            password_field = await self.page.query_selector('input[name="password"], input[type="password"]')
            login_button = await self.page.query_selector('button[type="submit"], input[type="submit"]')
            
            if username_field and password_field and login_button:
                await username_field.fill(username)
                await password_field.fill(password)
                await login_button.click()
                
                # Wait for navigation after login
                await self.page.wait_for_load_state('networkidle')
                self.logger.info("Login successful")
                return True
            else:
                self.logger.warning("Login form not found")
                return False
                
        except Exception as e:
            self.logger.error(f"Login failed: {e}")
            return False
    
    async def set_bet_amount(self, amount: float) -> bool:
        """Set the bet amount for the game"""
        try:
            # These selectors would need to be updated based on actual site structure
            bet_input = await self.page.query_selector('input[data-testid="bet-amount"], .bet-input, #bet-amount')
            
            if bet_input:
                await bet_input.clear()
                await bet_input.fill(str(amount))
                self.logger.info(f"Set bet amount to {amount}")
                return True
            else:
                self.logger.warning("Bet amount input not found")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to set bet amount: {e}")
            return False
    
    async def start_new_game(self) -> bool:
        """Start a new mines game"""
        try:
            # Look for start/play button
            start_button = await self.page.query_selector('button[data-testid="start-game"], .play-button, #start-game')
            
            if start_button:
                await start_button.click()
                await asyncio.sleep(Config.CLICK_DELAY)
                self.logger.info("Started new game")
                return True
            else:
                self.logger.warning("Start game button not found")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to start new game: {e}")
            return False
    
    async def click_square(self, square_number: int) -> bool:
        """
        Click a specific square on the mines grid
        
        Args:
            square_number: The square number to click (0-24 for 5x5 grid)
            
        Returns:
            True if click successful, False otherwise
        """
        try:
            # These selectors would need to be updated based on actual site structure
            square_selector = f'[data-square="{square_number}"], .grid-square:nth-child({square_number + 1})'
            square = await self.page.query_selector(square_selector)
            
            if square:
                await square.click()
                await asyncio.sleep(Config.CLICK_DELAY)
                self.logger.info(f"Clicked square {square_number}")
                return True
            else:
                self.logger.warning(f"Square {square_number} not found")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to click square {square_number}: {e}")
            return False
    
    async def cash_out(self) -> bool:
        """Cash out the current game"""
        try:
            cashout_button = await self.page.query_selector('button[data-testid="cashout"], .cashout-button, #cashout')
            
            if cashout_button:
                await cashout_button.click()
                await asyncio.sleep(Config.CLICK_DELAY)
                self.logger.info("Cashed out successfully")
                return True
            else:
                self.logger.warning("Cashout button not found")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to cash out: {e}")
            return False
    
    async def get_game_state(self) -> GameState:
        """
        Analyze the current game state from the page
        
        Returns:
            GameState object with current game information
        """
        game_state = GameState()
        
        try:
            # Get multiplier (these selectors need to be updated based on actual site)
            multiplier_element = await self.page.query_selector('.multiplier, [data-testid="multiplier"]')
            if multiplier_element:
                multiplier_text = await multiplier_element.text_content()
                if multiplier_text:
                    # Extract number from text like "2.5x" or "2.5"
                    multiplier_str = multiplier_text.replace('x', '').strip()
                    game_state.current_multiplier = float(multiplier_str)
            
            # Get revealed squares by checking which squares have been clicked
            for i in range(Config.GRID_SIZE):
                square_selector = f'[data-square="{i}"].revealed, .grid-square:nth-child({i + 1}).revealed'
                square = await self.page.query_selector(square_selector)
                if square:
                    game_state.revealed_squares.add(i)
            
            self.logger.debug(f"Current game state: {len(game_state.revealed_squares)} squares revealed, "
                            f"multiplier: {game_state.current_multiplier}")
            
        except Exception as e:
            self.logger.error(f"Failed to get game state: {e}")
        
        return game_state
    
    async def is_game_over(self) -> bool:
        """Check if the current game has ended (win or loss)"""
        try:
            # Look for game over indicators
            game_over_selectors = [
                '.game-over',
                '[data-testid="game-over"]',
                '.mine-hit',
                '.game-won',
                '.game-lost'
            ]
            
            for selector in game_over_selectors:
                element = await self.page.query_selector(selector)
                if element:
                    return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Failed to check game over state: {e}")
            return False
    
    async def get_balance(self) -> float:
        """Get current account balance"""
        try:
            balance_element = await self.page.query_selector('.balance, [data-testid="balance"], #balance')
            if balance_element:
                balance_text = await balance_element.text_content()
                if balance_text:
                    # Extract number from balance text
                    balance_str = balance_text.replace('$', '').replace(',', '').strip()
                    return float(balance_str)
            
            return 0.0
            
        except Exception as e:
            self.logger.error(f"Failed to get balance: {e}")
            return 0.0
    
    async def close(self) -> None:
        """Close the browser and clean up resources"""
        if self.browser:
            await self.browser.close()
            self.logger.info("Browser closed")