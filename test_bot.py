"""
Ultimate Mine Bot - Test Suite
Basic tests to validate bot functionality
"""
import unittest
import os
import tempfile
import json
from unittest.mock import Mock, patch, MagicMock

# Import bot modules
from config import Config
from strategy import MineStrategy
from game_logic import MineGame

class TestConfig(unittest.TestCase):
    def setUp(self):
        # Create temporary .env file for testing
        self.temp_env = tempfile.NamedTemporaryFile(mode='w', suffix='.env', delete=False)
        self.temp_env.write("""
BANDIT_USERNAME=test_user
BANDIT_PASSWORD=test_pass
HEADLESS_MODE=True
GAME_DELAY=0.5
MAX_GAMES_PER_SESSION=5
ENABLE_CHEATS=True
""")
        self.temp_env.close()
        
        # Set environment variable to use temp file
        os.environ['DOTENV_PATH'] = self.temp_env.name
    
    def tearDown(self):
        os.unlink(self.temp_env.name)
        if 'DOTENV_PATH' in os.environ:
            del os.environ['DOTENV_PATH']
    
    def test_config_loading(self):
        """Test that configuration loads correctly"""
        config = Config()
        self.assertEqual(config.username, 'test_user')
        self.assertEqual(config.password, 'test_pass')
        self.assertTrue(config.headless_mode)
        self.assertEqual(config.game_delay, 0.5)
        self.assertEqual(config.max_games_per_session, 5)
        self.assertTrue(config.enable_cheats)
    
    def test_config_validation(self):
        """Test configuration validation"""
        config = Config()
        # Should be valid with username and password
        self.assertTrue(config.validate())
        
        # Should be invalid without username
        config.username = ''
        self.assertFalse(config.validate())
    
    def test_config_to_dict(self):
        """Test configuration to dictionary conversion"""
        config = Config()
        config_dict = config.to_dict()
        
        # Should not include sensitive data
        self.assertNotIn('username', config_dict)
        self.assertNotIn('password', config_dict)
        
        # Should include non-sensitive config
        self.assertIn('headless_mode', config_dict)
        self.assertIn('game_delay', config_dict)

class TestGameLogic(unittest.TestCase):
    def setUp(self):
        # Mock WebDriverManager
        self.mock_driver_manager = Mock()
        self.mock_driver = Mock()
        self.mock_wait = Mock()
        
        self.mock_driver_manager.driver = self.mock_driver
        self.mock_driver_manager.wait = self.mock_wait
        
        self.game = MineGame(self.mock_driver_manager)
    
    def test_tile_state_detection(self):
        """Test tile state detection"""
        # Mock tile element
        mock_tile = Mock()
        mock_tile.get_attribute.return_value = "revealed mine"
        mock_tile.text = "💣"
        
        self.game.tiles = [mock_tile]
        
        state = self.game.get_tile_state(0)
        self.assertEqual(state, "mine")
    
    def test_board_size_detection(self):
        """Test board size detection"""
        # Mock 64 tiles for 8x8 board
        mock_tiles = []
        for i in range(64):
            mock_tile = Mock()
            mock_tile.location = {'x': (i % 8) * 30, 'y': (i // 8) * 30}
            mock_tile.size = {'width': 25, 'height': 25}
            mock_tiles.append(mock_tile)
        
        self.game.tiles = mock_tiles
        
        result = self.game.analyze_board_layout()
        self.assertTrue(result)
        self.assertEqual(self.game.board_size, (8, 8))
    
    def test_click_tile(self):
        """Test tile clicking"""
        mock_tile = Mock()
        self.game.tiles = [mock_tile]
        
        result = self.game.click_tile(0)
        self.assertTrue(result)
        mock_tile.click.assert_called_once()
    
    def test_click_invalid_tile(self):
        """Test clicking invalid tile index"""
        self.game.tiles = []
        
        result = self.game.click_tile(0)
        self.assertFalse(result)

class TestStrategy(unittest.TestCase):
    def setUp(self):
        # Mock game object
        self.mock_game = Mock()
        self.mock_game.board_size = (8, 8)
        self.mock_game.tiles = [Mock() for _ in range(64)]
        
        self.strategy = MineStrategy(self.mock_game)
    
    def test_neighbor_calculation(self):
        """Test neighbor coordinate calculation"""
        neighbors = self.strategy.get_neighbors(3, 3)
        
        # Should have 8 neighbors for middle tile
        self.assertEqual(len(neighbors), 8)
        
        # Check specific neighbors
        expected_neighbors = [
            (2, 2), (2, 3), (2, 4),
            (3, 2),         (3, 4),
            (4, 2), (4, 3), (4, 4)
        ]
        
        for neighbor in expected_neighbors:
            self.assertIn(neighbor, neighbors)
    
    def test_corner_neighbors(self):
        """Test neighbor calculation for corner tile"""
        neighbors = self.strategy.get_neighbors(0, 0)
        
        # Corner should have 3 neighbors
        self.assertEqual(len(neighbors), 3)
        
        expected_neighbors = [(0, 1), (1, 0), (1, 1)]
        for neighbor in expected_neighbors:
            self.assertIn(neighbor, neighbors)
    
    def test_probability_calculation(self):
        """Test mine probability calculation"""
        # Mock board state with some revealed numbers
        import numpy as np
        self.mock_game.board_state = np.full((8, 8), "hidden", dtype=object)
        self.mock_game.board_state[3, 3] = "number_1"
        self.mock_game.board_state[3, 4] = "flagged"
        
        probabilities = self.strategy.calculate_probabilities()
        
        # Should return dictionary with tile indices as keys
        self.assertIsInstance(probabilities, dict)
        
        # Probabilities should be between 0 and 1
        for prob in probabilities.values():
            self.assertGreaterEqual(prob, 0.0)
            self.assertLessEqual(prob, 1.0)
    
    def test_safe_move_detection(self):
        """Test detection of safe moves"""
        import numpy as np
        
        # Create a scenario where we can detect safe moves
        self.mock_game.board_state = np.full((8, 8), "hidden", dtype=object)
        
        # Place a "1" with one adjacent flag - remaining neighbors should be safe
        self.mock_game.board_state[3, 3] = "number_1"
        self.mock_game.board_state[3, 4] = "flagged"
        
        # Mock the is_number_satisfied method to return True
        with patch.object(self.strategy, 'is_number_satisfied', return_value=True):
            safe_moves = self.strategy.analyze_safe_moves()
            
            # Should find some safe moves
            self.assertIsInstance(safe_moves, list)
    
    def test_mine_detection(self):
        """Test detection of definite mines"""
        import numpy as np
        
        # Create scenario where mines can be detected
        self.mock_game.board_state = np.full((8, 8), "hidden", dtype=object)
        
        # Place a "1" with one hidden neighbor - that neighbor must be a mine
        self.mock_game.board_state[3, 3] = "number_1"
        # All neighbors except one are revealed/flagged
        self.mock_game.board_state[2, 2] = "empty"
        self.mock_game.board_state[2, 3] = "empty"
        self.mock_game.board_state[2, 4] = "empty"
        self.mock_game.board_state[3, 2] = "empty"
        self.mock_game.board_state[3, 4] = "empty"
        self.mock_game.board_state[4, 2] = "empty"
        self.mock_game.board_state[4, 3] = "empty"
        # (4, 4) remains hidden - must be the mine
        
        mine_tiles = self.strategy.analyze_mine_locations()
        
        # Should detect the mine at position (4, 4) -> tile index 36
        expected_mine_tile = 4 * 8 + 4  # Row 4, Col 4 in 8x8 grid
        self.assertIn(expected_mine_tile, mine_tiles)
    
    def test_statistics_tracking(self):
        """Test statistics tracking"""
        initial_moves = self.strategy.moves_made
        initial_successful = self.strategy.successful_moves
        
        # Update statistics
        self.strategy.update_statistics(True)
        
        self.assertEqual(self.strategy.moves_made, initial_moves + 1)
        self.assertEqual(self.strategy.successful_moves, initial_successful + 1)
        
        # Test failed move
        self.strategy.update_statistics(False)
        
        self.assertEqual(self.strategy.moves_made, initial_moves + 2)
        self.assertEqual(self.strategy.successful_moves, initial_successful + 1)
    
    def test_game_result_recording(self):
        """Test game result recording"""
        initial_games = self.strategy.games_played
        initial_wins = self.strategy.games_won
        
        # Record a win
        self.strategy.record_game_result(True)
        
        self.assertEqual(self.strategy.games_played, initial_games + 1)
        self.assertEqual(self.strategy.games_won, initial_wins + 1)
        
        # Record a loss
        self.strategy.record_game_result(False)
        
        self.assertEqual(self.strategy.games_played, initial_games + 2)
        self.assertEqual(self.strategy.games_won, initial_wins + 1)
    
    def test_performance_stats(self):
        """Test performance statistics calculation"""
        # Set some test data
        self.strategy.games_played = 10
        self.strategy.games_won = 7
        self.strategy.moves_made = 100
        self.strategy.successful_moves = 85
        
        stats = self.strategy.get_performance_stats()
        
        self.assertEqual(stats['games_played'], 10)
        self.assertEqual(stats['games_won'], 7)
        self.assertAlmostEqual(stats['win_rate'], 0.7)
        self.assertEqual(stats['moves_made'], 100)
        self.assertEqual(stats['successful_moves'], 85)
        self.assertAlmostEqual(stats['move_success_rate'], 0.85)

class TestIntegration(unittest.TestCase):
    """Integration tests for bot components"""
    
    def test_config_integration(self):
        """Test that all components can use config"""
        # This would test that Config can be used by all components
        # For now, just test that it can be imported and instantiated
        config = Config()
        
        # Should have default values even without .env
        self.assertIsInstance(config.base_url, str)
        self.assertIsInstance(config.headless_mode, bool)
    
    @patch('selenium.webdriver.Chrome')
    @patch('webdriver_manager.chrome.ChromeDriverManager')
    def test_webdriver_integration(self, mock_driver_manager, mock_chrome):
        """Test WebDriver integration with mocked Selenium"""
        from web_driver import WebDriverManager
        
        # Mock the ChromeDriverManager
        mock_driver_manager.return_value.install.return_value = '/path/to/chromedriver'
        
        # Mock the Chrome WebDriver
        mock_driver_instance = Mock()
        mock_chrome.return_value = mock_driver_instance
        
        config = Config()
        driver_manager = WebDriverManager(config)
        
        # This should not raise an exception
        driver_manager.setup_driver()
        
        # Verify Chrome was called
        mock_chrome.assert_called_once()

def run_tests():
    """Run all tests"""
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add test cases
    test_suite.addTest(unittest.makeSuite(TestConfig))
    test_suite.addTest(unittest.makeSuite(TestGameLogic))
    test_suite.addTest(unittest.makeSuite(TestStrategy))
    test_suite.addTest(unittest.makeSuite(TestIntegration))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    return result.wasSuccessful()

if __name__ == '__main__':
    print("Running Ultimate Mine Bot Test Suite...")
    print("=" * 50)
    
    success = run_tests()
    
    if success:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")
        exit(1)