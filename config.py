"""
Configuration settings for the Ultimate Mine Bot
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Site settings
    BASE_URL = "https://bandit.camp"
    MINES_URL = f"{BASE_URL}/mines"
    
    # Bot settings
    DEFAULT_BET_AMOUNT = float(os.getenv('DEFAULT_BET_AMOUNT', '0.01'))
    MINE_COUNT = int(os.getenv('MINE_COUNT', '3'))  # Number of mines in the game
    GRID_SIZE = int(os.getenv('GRID_SIZE', '25'))  # Total number of squares (5x5 grid)
    
    # Risk management
    MAX_BET_AMOUNT = float(os.getenv('MAX_BET_AMOUNT', '1.0'))
    MIN_BET_AMOUNT = float(os.getenv('MIN_BET_AMOUNT', '0.001'))
    STOP_LOSS = float(os.getenv('STOP_LOSS', '10.0'))  # Stop if losses exceed this amount
    TAKE_PROFIT = float(os.getenv('TAKE_PROFIT', '50.0'))  # Stop if profits exceed this amount
    
    # Automation settings
    CLICK_DELAY = float(os.getenv('CLICK_DELAY', '1.0'))  # Delay between clicks in seconds
    PAGE_LOAD_TIMEOUT = int(os.getenv('PAGE_LOAD_TIMEOUT', '30000'))  # Milliseconds
    
    # Strategy settings
    CONSERVATIVE_MODE = os.getenv('CONSERVATIVE_MODE', 'True').lower() == 'true'
    AUTO_CASHOUT_AFTER = int(os.getenv('AUTO_CASHOUT_AFTER', '3'))  # Auto cashout after N safe clicks
    
    # Authentication (if needed)
    USERNAME = os.getenv('USERNAME', '')
    PASSWORD = os.getenv('PASSWORD', '')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'mine_bot.log')