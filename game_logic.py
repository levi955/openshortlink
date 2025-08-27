"""
Ultimate Mine Bot - Game Logic
Handles minesweeper game detection, interaction, and strategy
"""
import time
import random
import logging
import numpy as np
from typing import List, Tuple, Dict, Set, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from web_driver import WebDriverManager

class MineGame:
    def __init__(self, driver_manager: WebDriverManager):
        self.driver_manager = driver_manager
        self.driver = driver_manager.driver
        self.wait = driver_manager.wait
        self.logger = logging.getLogger(__name__)
        
        # Game state
        self.board_size = None
        self.board_state = None
        self.mine_count = 0
        self.flags_placed = 0
        self.game_over = False
        self.game_won = False
        
        # Game elements cache
        self.game_board = None
        self.tiles = []
        
    def detect_game_board(self) -> bool:
        """Detect and initialize the game board"""
        try:
            self.logger.info("Detecting game board...")
            
            # Look for common minesweeper board selectors
            possible_selectors = [
                ".game-board",
                ".minefield",
                ".mines-board",
                "[data-testid='game-board']",
                ".board",
                "table.game",
                "#game-board"
            ]
            
            for selector in possible_selectors:
                try:
                    board = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if board:
                        self.game_board = board
                        self.logger.info(f"Game board found with selector: {selector}")
                        break
                except NoSuchElementException:
                    continue
            
            if not self.game_board:
                # Try to find board by looking for multiple clickable tiles
                tiles = self.driver.find_elements(By.CSS_SELECTOR, 
                    "div[onclick], button[data-x], .tile, .cell, [class*='mine'], [class*='cell']")
                
                if len(tiles) > 16:  # Minimum for a 4x4 board
                    self.tiles = tiles
                    self.logger.info(f"Found {len(tiles)} potential game tiles")
                    return True
            
            if self.game_board:
                # Find all tiles within the board
                self.tiles = self.game_board.find_elements(By.CSS_SELECTOR, 
                    "div, button, td, .tile, .cell")
                self.logger.info(f"Found {len(self.tiles)} tiles in game board")
                return True
                
            return False
            
        except Exception as e:
            self.logger.error(f"Error detecting game board: {e}")
            return False
    
    def analyze_board_layout(self) -> bool:
        """Analyze the board layout to determine size and structure"""
        try:
            if not self.tiles:
                return False
            
            # Try to determine board dimensions
            tile_positions = []
            for tile in self.tiles[:25]:  # Check first 25 tiles to avoid too much processing
                try:
                    location = tile.location
                    size = tile.size
                    tile_positions.append((location['x'], location['y'], size['width'], size['height']))
                except:
                    continue
            
            if len(tile_positions) < 4:
                return False
            
            # Analyze positions to determine grid layout
            x_positions = sorted(set([pos[0] for pos in tile_positions]))
            y_positions = sorted(set([pos[1] for pos in tile_positions]))
            
            # Estimate board size
            cols = len(x_positions)
            rows = len(y_positions)
            
            # Common minesweeper board sizes
            if cols * rows in [64, 81, 256]:  # 8x8, 9x9, 16x16
                self.board_size = (rows, cols)
                self.logger.info(f"Detected board size: {rows}x{cols}")
                return True
            
            # Fallback: use total tiles to estimate
            total_tiles = len(self.tiles)
            possible_sizes = [(8, 8), (9, 9), (16, 16), (10, 10), (12, 12)]
            
            for r, c in possible_sizes:
                if abs(r * c - total_tiles) <= 2:  # Allow small variance
                    self.board_size = (r, c)
                    self.logger.info(f"Estimated board size: {r}x{c} (from {total_tiles} tiles)")
                    return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error analyzing board layout: {e}")
            return False
    
    def click_tile(self, tile_index: int) -> bool:
        """Click on a specific tile"""
        try:
            if tile_index >= len(self.tiles):
                return False
            
            tile = self.tiles[tile_index]
            tile.click()
            time.sleep(0.5)  # Small delay to let the game respond
            return True
            
        except Exception as e:
            self.logger.error(f"Error clicking tile {tile_index}: {e}")
            return False
    
    def right_click_tile(self, tile_index: int) -> bool:
        """Right-click (flag) a specific tile"""
        try:
            from selenium.webdriver.common.action_chains import ActionChains
            
            if tile_index >= len(self.tiles):
                return False
            
            tile = self.tiles[tile_index]
            actions = ActionChains(self.driver)
            actions.context_click(tile).perform()
            time.sleep(0.5)
            return True
            
        except Exception as e:
            self.logger.error(f"Error right-clicking tile {tile_index}: {e}")
            return False
    
    def get_tile_state(self, tile_index: int) -> str:
        """Get the current state of a tile (hidden, revealed, flagged, mine, number)"""
        try:
            if tile_index >= len(self.tiles):
                return "unknown"
            
            tile = self.tiles[tile_index]
            
            # Check tile classes and attributes
            class_name = tile.get_attribute("class") or ""
            text_content = tile.text.strip()
            data_state = tile.get_attribute("data-state")
            
            # Common patterns for different tile states
            if "flag" in class_name.lower() or "🚩" in text_content:
                return "flagged"
            elif "mine" in class_name.lower() or "💣" in text_content or "*" in text_content:
                return "mine"
            elif "revealed" in class_name.lower() or "open" in class_name.lower():
                if text_content.isdigit():
                    return f"number_{text_content}"
                else:
                    return "empty"
            elif "hidden" in class_name.lower() or "closed" in class_name.lower():
                return "hidden"
            elif data_state:
                return data_state
            else:
                # Try to infer from text content
                if text_content.isdigit():
                    return f"number_{text_content}"
                elif text_content == "":
                    return "hidden"
                else:
                    return "unknown"
                    
        except Exception as e:
            self.logger.error(f"Error getting tile state for {tile_index}: {e}")
            return "unknown"
    
    def update_board_state(self):
        """Update the internal board state representation"""
        try:
            if not self.board_size:
                return
            
            rows, cols = self.board_size
            self.board_state = np.full((rows, cols), "hidden", dtype=object)
            
            for i, tile in enumerate(self.tiles[:rows * cols]):
                row = i // cols
                col = i % cols
                self.board_state[row, col] = self.get_tile_state(i)
                
        except Exception as e:
            self.logger.error(f"Error updating board state: {e}")
    
    def is_game_over(self) -> bool:
        """Check if the game is over (won or lost)"""
        try:
            # Look for game over indicators
            game_over_selectors = [
                ".game-over",
                ".game-lost",
                ".game-won",
                "[data-game-state='over']",
                "[data-game-state='won']",
                "[data-game-state='lost']"
            ]
            
            for selector in game_over_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    return True
            
            # Check for text indicators
            page_text = self.driver.page_source.lower()
            if any(phrase in page_text for phrase in ["game over", "you lost", "you won", "game complete"]):
                return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error checking game over state: {e}")
            return False
    
    def restart_game(self) -> bool:
        """Restart the game"""
        try:
            # Look for restart/new game button
            restart_selectors = [
                ".restart",
                ".new-game",
                "[data-action='restart']",
                "button[onclick*='restart']",
                "button[onclick*='newGame']"
            ]
            
            for selector in restart_selectors:
                try:
                    button = self.driver.find_element(By.CSS_SELECTOR, selector)
                    button.click()
                    time.sleep(2)
                    return True
                except NoSuchElementException:
                    continue
            
            # Try refreshing the page as fallback
            self.driver.refresh()
            time.sleep(3)
            return True
            
        except Exception as e:
            self.logger.error(f"Error restarting game: {e}")
            return False