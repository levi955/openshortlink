"""
Ultimate Mine Bot - AI Strategy Engine
Implements various minesweeper solving strategies and learning algorithms
"""
import random
import logging
import numpy as np
from typing import List, Tuple, Dict, Set, Optional
from game_logic import MineGame

class MineStrategy:
    def __init__(self, game: MineGame):
        self.game = game
        self.logger = logging.getLogger(__name__)
        
        # Strategy statistics
        self.games_played = 0
        self.games_won = 0
        self.moves_made = 0
        self.successful_moves = 0
        
        # Learning data
        self.pattern_memory = {}
        self.safe_patterns = set()
        self.danger_patterns = set()
        
    def analyze_safe_moves(self) -> List[int]:
        """Find tiles that are definitely safe to click"""
        safe_moves = []
        
        if not self.game.board_state is None and self.game.board_size:
            rows, cols = self.game.board_size
            
            for row in range(rows):
                for col in range(cols):
                    tile_idx = row * cols + col
                    
                    if tile_idx >= len(self.game.tiles):
                        continue
                    
                    state = self.game.board_state[row, col]
                    
                    if state.startswith("number_"):
                        # Check if this number cell has been satisfied
                        if self.is_number_satisfied(row, col):
                            # All neighbors of satisfied numbers are safe
                            neighbors = self.get_neighbors(row, col)
                            for nr, nc in neighbors:
                                neighbor_idx = nr * cols + nc
                                neighbor_state = self.game.board_state[nr, nc]
                                if neighbor_state == "hidden" and neighbor_idx not in safe_moves:
                                    safe_moves.append(neighbor_idx)
        
        return safe_moves
    
    def analyze_mine_locations(self) -> List[int]:
        """Find tiles that are definitely mines"""
        mine_tiles = []
        
        if not self.game.board_state is None and self.game.board_size:
            rows, cols = self.game.board_size
            
            for row in range(rows):
                for col in range(cols):
                    tile_idx = row * cols + col
                    
                    if tile_idx >= len(self.game.tiles):
                        continue
                    
                    state = self.game.board_state[row, col]
                    
                    if state.startswith("number_"):
                        number = int(state.split("_")[1])
                        neighbors = self.get_neighbors(row, col)
                        
                        hidden_neighbors = []
                        flagged_count = 0
                        
                        for nr, nc in neighbors:
                            neighbor_state = self.game.board_state[nr, nc]
                            if neighbor_state == "hidden":
                                hidden_neighbors.append((nr, nc))
                            elif neighbor_state == "flagged":
                                flagged_count += 1
                        
                        # If number of flags + hidden neighbors equals the number,
                        # all hidden neighbors are mines
                        remaining_mines = number - flagged_count
                        if remaining_mines == len(hidden_neighbors) and remaining_mines > 0:
                            for nr, nc in hidden_neighbors:
                                neighbor_idx = nr * cols + nc
                                if neighbor_idx not in mine_tiles:
                                    mine_tiles.append(neighbor_idx)
        
        return mine_tiles
    
    def get_neighbors(self, row: int, col: int) -> List[Tuple[int, int]]:
        """Get all valid neighbor coordinates"""
        neighbors = []
        rows, cols = self.game.board_size
        
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                if dr == 0 and dc == 0:
                    continue
                nr, nc = row + dr, col + dc
                if 0 <= nr < rows and 0 <= nc < cols:
                    neighbors.append((nr, nc))
        
        return neighbors
    
    def is_number_satisfied(self, row: int, col: int) -> bool:
        """Check if a number cell has the correct number of flags around it"""
        if not self.game.board_state[row, col].startswith("number_"):
            return False
        
        number = int(self.game.board_state[row, col].split("_")[1])
        neighbors = self.get_neighbors(row, col)
        
        flagged_count = 0
        for nr, nc in neighbors:
            if self.game.board_state[nr, nc] == "flagged":
                flagged_count += 1
        
        return flagged_count == number
    
    def calculate_probabilities(self) -> Dict[int, float]:
        """Calculate probability of each hidden tile being a mine"""
        probabilities = {}
        
        if not self.game.board_state is None and self.game.board_size:
            rows, cols = self.game.board_size
            
            # Default probability based on remaining mines
            total_hidden = 0
            total_flagged = 0
            
            for row in range(rows):
                for col in range(cols):
                    state = self.game.board_state[row, col]
                    if state == "hidden":
                        total_hidden += 1
                    elif state == "flagged":
                        total_flagged += 1
            
            # Estimate remaining mines (this could be improved with game-specific logic)
            estimated_total_mines = max(rows * cols // 6, 10)  # Rough estimate
            remaining_mines = max(estimated_total_mines - total_flagged, 0)
            
            default_probability = remaining_mines / max(total_hidden, 1)
            
            # Calculate probabilities for each hidden tile
            for row in range(rows):
                for col in range(cols):
                    tile_idx = row * cols + col
                    if tile_idx >= len(self.game.tiles):
                        continue
                    
                    state = self.game.board_state[row, col]
                    if state == "hidden":
                        probabilities[tile_idx] = self.calculate_tile_probability(row, col, default_probability)
        
        return probabilities
    
    def calculate_tile_probability(self, row: int, col: int, default_prob: float) -> float:
        """Calculate probability for a specific tile being a mine"""
        # Start with default probability
        probability = default_prob
        
        # Adjust based on neighboring number cells
        neighbors = self.get_neighbors(row, col)
        constraints = []
        
        for nr, nc in neighbors:
            neighbor_state = self.game.board_state[nr, nc]
            if neighbor_state.startswith("number_"):
                number = int(neighbor_state.split("_")[1])
                neighbor_neighbors = self.get_neighbors(nr, nc)
                
                hidden_count = 0
                flagged_count = 0
                
                for nnr, nnc in neighbor_neighbors:
                    nn_state = self.game.board_state[nnr, nnc]
                    if nn_state == "hidden":
                        hidden_count += 1
                    elif nn_state == "flagged":
                        flagged_count += 1
                
                remaining_mines = number - flagged_count
                if hidden_count > 0:
                    local_probability = remaining_mines / hidden_count
                    constraints.append(local_probability)
        
        # Average the constraints if any exist
        if constraints:
            probability = sum(constraints) / len(constraints)
        
        return max(0.0, min(1.0, probability))
    
    def choose_best_move(self) -> Optional[int]:
        """Choose the best move based on current strategy"""
        # Update board state
        self.game.update_board_state()
        
        # First, try to find definitely safe moves
        safe_moves = self.analyze_safe_moves()
        if safe_moves:
            self.logger.info(f"Found {len(safe_moves)} safe moves")
            return random.choice(safe_moves)
        
        # Flag definite mines
        mine_tiles = self.analyze_mine_locations()
        for mine_tile in mine_tiles:
            if mine_tile < len(self.game.tiles):
                self.game.right_click_tile(mine_tile)
                self.logger.info(f"Flagged mine at tile {mine_tile}")
        
        # Calculate probabilities and choose lowest risk
        probabilities = self.calculate_probabilities()
        if probabilities:
            # Filter out already revealed or flagged tiles
            valid_moves = {}
            for tile_idx, prob in probabilities.items():
                if tile_idx < len(self.game.tiles):
                    state = self.game.get_tile_state(tile_idx)
                    if state == "hidden":
                        valid_moves[tile_idx] = prob
            
            if valid_moves:
                # Choose tile with lowest mine probability
                best_tile = min(valid_moves.keys(), key=lambda x: valid_moves[x])
                self.logger.info(f"Choosing tile {best_tile} with probability {valid_moves[best_tile]:.3f}")
                return best_tile
        
        # Fallback: random hidden tile
        return self.choose_random_move()
    
    def choose_random_move(self) -> Optional[int]:
        """Choose a random hidden tile"""
        hidden_tiles = []
        for i in range(len(self.game.tiles)):
            state = self.game.get_tile_state(i)
            if state == "hidden":
                hidden_tiles.append(i)
        
        if hidden_tiles:
            choice = random.choice(hidden_tiles)
            self.logger.info(f"Random move: tile {choice}")
            return choice
        
        return None
    
    def make_opening_move(self) -> Optional[int]:
        """Make the first move of the game (usually corner or center)"""
        if not self.game.board_size:
            return self.choose_random_move()
        
        rows, cols = self.game.board_size
        
        # Prefer corners for opening moves
        corner_positions = [
            0,  # top-left
            cols - 1,  # top-right
            (rows - 1) * cols,  # bottom-left
            rows * cols - 1  # bottom-right
        ]
        
        # Filter valid corners
        valid_corners = [pos for pos in corner_positions if pos < len(self.game.tiles)]
        
        if valid_corners:
            choice = random.choice(valid_corners)
            self.logger.info(f"Opening move: corner tile {choice}")
            return choice
        
        # Fallback to center
        center_tile = (rows // 2) * cols + (cols // 2)
        if center_tile < len(self.game.tiles):
            self.logger.info(f"Opening move: center tile {center_tile}")
            return center_tile
        
        return self.choose_random_move()
    
    def update_statistics(self, move_successful: bool):
        """Update strategy statistics"""
        self.moves_made += 1
        if move_successful:
            self.successful_moves += 1
        
        # Log performance metrics
        if self.moves_made > 0:
            success_rate = self.successful_moves / self.moves_made
            self.logger.info(f"Move success rate: {success_rate:.2%}")
    
    def record_game_result(self, won: bool):
        """Record the result of a completed game"""
        self.games_played += 1
        if won:
            self.games_won += 1
        
        win_rate = self.games_won / self.games_played if self.games_played > 0 else 0
        self.logger.info(f"Game {self.games_played} {'WON' if won else 'LOST'}. Win rate: {win_rate:.2%}")
    
    def get_performance_stats(self) -> Dict[str, float]:
        """Get current performance statistics"""
        return {
            'games_played': self.games_played,
            'games_won': self.games_won,
            'win_rate': self.games_won / max(self.games_played, 1),
            'moves_made': self.moves_made,
            'successful_moves': self.successful_moves,
            'move_success_rate': self.successful_moves / max(self.moves_made, 1)
        }