"""
Ultimate Mine Bot - Web Driver Manager
Handles browser automation and session management
"""
import time
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from config import Config

class WebDriverManager:
    def __init__(self, config: Config):
        self.config = config
        self.driver = None
        self.wait = None
        self.logged_in = False
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def setup_driver(self):
        """Initialize Chrome WebDriver with appropriate options"""
        chrome_options = Options()
        
        if self.config.headless_mode:
            chrome_options.add_argument('--headless')
        
        # Add additional options for stability
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        
        # Install and setup ChromeDriver
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.wait = WebDriverWait(self.driver, 10)
        
        self.logger.info("WebDriver initialized successfully")
        
    def navigate_to_site(self) -> bool:
        """Navigate to bandit.camp"""
        try:
            self.logger.info(f"Navigating to {self.config.base_url}")
            self.driver.get(self.config.base_url)
            time.sleep(2)
            return True
        except Exception as e:
            self.logger.error(f"Failed to navigate to site: {e}")
            return False
    
    def login(self) -> bool:
        """Attempt to login to bandit.camp"""
        try:
            self.logger.info("Attempting to login...")
            
            # Navigate to login page
            self.driver.get(self.config.login_url)
            time.sleep(2)
            
            # Find and fill username field
            username_field = self.wait.until(
                EC.presence_of_element_located((By.NAME, "username"))
            )
            username_field.clear()
            username_field.send_keys(self.config.username)
            
            # Find and fill password field
            password_field = self.driver.find_element(By.NAME, "password")
            password_field.clear()
            password_field.send_keys(self.config.password)
            
            # Submit login form
            login_button = self.driver.find_element(By.XPATH, "//button[@type='submit']")
            login_button.click()
            
            # Wait for login to complete
            time.sleep(3)
            
            # Check if login was successful
            if self.is_logged_in():
                self.logged_in = True
                self.logger.info("Login successful!")
                return True
            else:
                self.logger.error("Login failed - credentials may be incorrect")
                return False
                
        except TimeoutException:
            self.logger.error("Login timeout - elements not found")
            return False
        except Exception as e:
            self.logger.error(f"Login error: {e}")
            return False
    
    def is_logged_in(self) -> bool:
        """Check if user is currently logged in"""
        try:
            # Look for elements that indicate successful login
            # This might need adjustment based on actual site structure
            profile_elements = self.driver.find_elements(By.CLASS_NAME, "user-profile")
            logout_elements = self.driver.find_elements(By.XPATH, "//a[contains(text(), 'Logout')]")
            
            return len(profile_elements) > 0 or len(logout_elements) > 0
        except:
            return False
    
    def navigate_to_mines(self) -> bool:
        """Navigate to the mines game page"""
        try:
            self.logger.info("Navigating to mines game...")
            self.driver.get(self.config.mines_url)
            time.sleep(2)
            
            # Wait for game page to load
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to navigate to mines game: {e}")
            return False
    
    def take_screenshot(self, filename: str = None) -> str:
        """Take a screenshot of current page"""
        import os
        if not filename:
            filename = f"screenshot_{int(time.time())}.png"
        
        screenshot_path = f"screenshots/{filename}"
        os.makedirs("screenshots", exist_ok=True)
        
        self.driver.save_screenshot(screenshot_path)
        self.logger.info(f"Screenshot saved: {screenshot_path}")
        return screenshot_path
    
    def quit(self):
        """Clean up and close the browser"""
        if self.driver:
            self.driver.quit()
            self.logger.info("WebDriver closed")