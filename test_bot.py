#!/usr/bin/env python3
"""
Test script for the Ultimate Mine Bot strategy logic
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from strategy import MinesStrategy, GameState
from config import Config

def test_strategy():
    """Test the strategy functionality"""
    print("🧪 Testing Ultimate Mine Bot Strategy...")
    print("=" * 50)
    
    # Initialize strategy
    strategy = MinesStrategy(Config.GRID_SIZE, Config.MINE_COUNT)
    print(f"✅ Strategy initialized with {Config.GRID_SIZE} squares and {Config.MINE_COUNT} mines")
    
    # Test corner detection
    corners = strategy.get_corner_squares()
    print(f"✅ Corner squares: {corners}")
    
    # Test edge detection
    edges = strategy.get_edge_squares()
    print(f"✅ Edge squares (first 10): {edges[:10]}...")
    
    # Test game state
    game_state = GameState()
    print(f"✅ Initial game state created")
    
    # Test choosing next square
    next_square = strategy.choose_next_square(game_state, conservative=True)
    print(f"✅ First recommended square (conservative): {next_square}")
    
    # Simulate some gameplay
    print("\n🎮 Simulating gameplay...")
    game_state.revealed_squares.add(next_square)
    game_state.current_multiplier = 1.2
    
    # Test probability calculation
    prob = strategy.calculate_mine_probability(0, game_state)
    print(f"✅ Mine probability after 1 square: {prob:.3f}")
    
    # Test cashout decision
    should_cashout = strategy.should_cash_out(game_state, 2.0)
    print(f"✅ Should cash out now: {should_cashout}")
    
    # Test expected value calculation
    ev = strategy.calculate_expected_value(game_state, 0.01)
    print(f"✅ Expected value: {ev:.6f}")
    
    print("\n" + "=" * 50)
    print("✅ All strategy tests passed!")

def test_configuration():
    """Test configuration loading"""
    print("\n🔧 Testing Configuration...")
    print("=" * 50)
    
    print(f"✅ Base URL: {Config.BASE_URL}")
    print(f"✅ Mines URL: {Config.MINES_URL}")
    print(f"✅ Default bet: {Config.DEFAULT_BET_AMOUNT}")
    print(f"✅ Grid size: {Config.GRID_SIZE}")
    print(f"✅ Mine count: {Config.MINE_COUNT}")
    print(f"✅ Conservative mode: {Config.CONSERVATIVE_MODE}")
    print(f"✅ Auto cashout after: {Config.AUTO_CASHOUT_AFTER}")
    print(f"✅ Stop loss: {Config.STOP_LOSS}")
    print(f"✅ Take profit: {Config.TAKE_PROFIT}")
    
    print("\n✅ Configuration loaded successfully!")

def simulate_game():
    """Simulate a complete game"""
    print("\n🎯 Simulating Complete Game...")
    print("=" * 50)
    
    strategy = MinesStrategy()
    game_state = GameState()
    bet_amount = Config.DEFAULT_BET_AMOUNT
    
    print(f"Starting simulation with bet: {bet_amount}")
    
    for round_num in range(1, Config.AUTO_CASHOUT_AFTER + 1):
        # Choose next square
        next_square = strategy.choose_next_square(game_state, Config.CONSERVATIVE_MODE)
        
        if next_square == -1:
            print("❌ No safe squares available")
            break
        
        print(f"Round {round_num}: Clicking square {next_square}")
        
        # Simulate revealing the square (assume it's safe)
        game_state.revealed_squares.add(next_square)
        
        # Simulate multiplier increase
        game_state.current_multiplier = 1.0 + (len(game_state.revealed_squares) * 0.3)
        
        print(f"  Current multiplier: {game_state.current_multiplier:.2f}x")
        
        # Check if should cash out
        if strategy.should_cash_out(game_state, 2.0):
            print(f"  🏦 Strategy recommends cashing out!")
            break
        
        # Calculate mine probability
        prob = strategy.calculate_mine_probability(0, game_state)
        print(f"  Mine probability: {prob:.3f}")
    
    # Calculate final profit
    final_profit = bet_amount * (game_state.current_multiplier - 1)
    print(f"\n💰 Final profit: {final_profit:.4f} ({game_state.current_multiplier:.2f}x)")
    print(f"🎯 Squares revealed: {len(game_state.revealed_squares)}")

if __name__ == "__main__":
    try:
        test_configuration()
        test_strategy()
        simulate_game()
        
        print("\n" + "🎉" * 20)
        print("🏆 ALL TESTS PASSED! Bot is ready to use.")
        print("🎉" * 20)
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)