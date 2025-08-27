"""
Mines game strategy and logic for the Ultimate Mine Bot
"""
import random
import math
from typing import List, Tuple, Set
from dataclasses import dataclass

@dataclass
class GameState:
    """Represents the current state of a mines game"""
    grid_size: int = 25  # Total squares (5x5)
    mine_count: int = 3
    revealed_squares: Set[int] = None
    safe_squares: Set[int] = None
    current_multiplier: float = 1.0
    
    def __post_init__(self):
        if self.revealed_squares is None:
            self.revealed_squares = set()
        if self.safe_squares is None:
            self.safe_squares = set()

class MinesStrategy:
    """Strategy class for making decisions in the mines game"""
    
    def __init__(self, grid_size: int = 25, mine_count: int = 3):
        self.grid_size = grid_size
        self.mine_count = mine_count
        self.grid_width = int(math.sqrt(grid_size))  # Assuming square grid
        
    def calculate_mine_probability(self, square: int, game_state: GameState) -> float:
        """Calculate the probability that a given square contains a mine"""
        revealed_count = len(game_state.revealed_squares)
        remaining_squares = self.grid_size - revealed_count
        remaining_mines = self.mine_count
        
        if remaining_squares <= 0:
            return 0.0
        
        return remaining_mines / remaining_squares
    
    def get_corner_squares(self) -> List[int]:
        """Get corner square positions (generally safer strategy)"""
        corners = []
        if self.grid_width >= 3:
            corners = [0, self.grid_width - 1, 
                      self.grid_size - self.grid_width, 
                      self.grid_size - 1]
        return corners
    
    def get_edge_squares(self) -> List[int]:
        """Get edge square positions"""
        edges = []
        for i in range(self.grid_size):
            row = i // self.grid_width
            col = i % self.grid_width
            if row == 0 or row == self.grid_width - 1 or col == 0 or col == self.grid_width - 1:
                edges.append(i)
        return edges
    
    def get_safe_squares(self, game_state: GameState) -> List[int]:
        """Get list of squares that haven't been revealed yet"""
        all_squares = set(range(self.grid_size))
        unrevealed = all_squares - game_state.revealed_squares
        return list(unrevealed)
    
    def choose_next_square(self, game_state: GameState, conservative: bool = True) -> int:
        """
        Choose the next square to reveal based on strategy
        
        Args:
            game_state: Current game state
            conservative: If True, prefer corner/edge squares
            
        Returns:
            Square number to click next
        """
        safe_squares = self.get_safe_squares(game_state)
        
        if not safe_squares:
            return -1  # No safe squares left
        
        if conservative and len(game_state.revealed_squares) == 0:
            # First click - prefer corners
            corners = [sq for sq in self.get_corner_squares() if sq in safe_squares]
            if corners:
                return random.choice(corners)
            
            # If no corners available, try edges
            edges = [sq for sq in self.get_edge_squares() if sq in safe_squares]
            if edges:
                return random.choice(edges)
        
        # Default to random safe square
        return random.choice(safe_squares)
    
    def should_cash_out(self, game_state: GameState, target_profit_multiplier: float = 2.0) -> bool:
        """
        Determine if we should cash out now
        
        Args:
            game_state: Current game state
            target_profit_multiplier: Target multiplier to cash out at
            
        Returns:
            True if should cash out, False to continue
        """
        # Cash out if we've reached target multiplier
        if game_state.current_multiplier >= target_profit_multiplier:
            return True
        
        # Cash out if risk becomes too high
        remaining_squares = len(self.get_safe_squares(game_state))
        if remaining_squares <= self.mine_count:
            return True
        
        # Calculate risk vs reward
        mine_probability = self.calculate_mine_probability(0, game_state)
        if mine_probability > 0.5:  # More than 50% chance of hitting mine
            return True
        
        return False
    
    def calculate_expected_value(self, game_state: GameState, bet_amount: float) -> float:
        """Calculate expected value of continuing vs cashing out"""
        safe_squares = self.get_safe_squares(game_state)
        if not safe_squares:
            return 0.0
        
        mine_probability = self.calculate_mine_probability(0, game_state)
        win_probability = 1 - mine_probability
        
        current_value = bet_amount * game_state.current_multiplier
        
        # Simplified EV calculation
        expected_loss = bet_amount * mine_probability
        expected_gain = current_value * win_probability
        
        return expected_gain - expected_loss