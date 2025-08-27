"""
Ultimate Mine Bot - Configuration Manager
Handles environment variables and bot settings
"""
import os
from dotenv import load_dotenv
from typing import Dict, Any

class Config:
    def __init__(self):
        load_dotenv()
        
        # Account credentials
        self.username = os.getenv('BANDIT_USERNAME', '')
        self.password = os.getenv('BANDIT_PASSWORD', '')
        
        # Bot settings
        self.headless_mode = os.getenv('HEADLESS_MODE', 'False').lower() == 'true'
        self.game_delay = float(os.getenv('GAME_DELAY', '1.0'))
        self.max_games_per_session = int(os.getenv('MAX_GAMES_PER_SESSION', '10'))
        self.learning_rate = float(os.getenv('LEARNING_RATE', '0.01'))
        
        # Advanced features
        self.enable_cheats = os.getenv('ENABLE_CHEATS', 'False').lower() == 'true'
        self.enable_statistics = os.getenv('ENABLE_STATISTICS', 'True').lower() == 'true'
        self.save_game_data = os.getenv('SAVE_GAME_DATA', 'True').lower() == 'true'
        
        # URLs
        self.base_url = 'https://bandit.camp'
        self.mines_url = f'{self.base_url}/mines'
        self.login_url = f'{self.base_url}/login'
        
    def validate(self) -> bool:
        """Validate that required configuration is present"""
        if not self.username or not self.password:
            print("Error: Username and password must be set in .env file")
            return False
        return True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary (excluding sensitive data)"""
        return {
            'headless_mode': self.headless_mode,
            'game_delay': self.game_delay,
            'max_games_per_session': self.max_games_per_session,
            'learning_rate': self.learning_rate,
            'enable_cheats': self.enable_cheats,
            'enable_statistics': self.enable_statistics,
            'save_game_data': self.save_game_data,
        }