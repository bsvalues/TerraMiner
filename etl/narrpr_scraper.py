import os
import time
import logging
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager

# Configure logger
logger = logging.getLogger(__name__)

class NarrprScraper:
    """
    A class to handle login and data scraping from the NARRPR website.
    """
    
    def __init__(self, username, password, headless=True):
        """
        Initialize the NarrprScraper with credentials.
        
        Args:
            username (str): NARRPR account username/email
            password (str): NARRPR account password
            headless (bool): Whether to run the browser in headless mode
        """
        self.username = username
        self.password = password
        self.base_url = "https://www.narrpr.com"
        self.driver = None
        self.headless = headless
        self.is_logged_in = False
        self.setup_driver()
    
    def setup_driver(self):
        """Configure and initialize the Selenium WebDriver."""
        try:
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument("--headless")
            
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--window-size=1920,1080")
            
            # Initialize the driver
            self.driver = webdriver.Chrome(
                service=Service(ChromeDriverManager().install()),
                options=chrome_options
            )
            self.driver.implicitly_wait(10)
            logger.info("WebDriver initialized successfully")
            
        except WebDriverException as e:
            logger.error(f"Failed to initialize WebDriver: {str(e)}")
            raise
    
    def login(self):
        """
        Log in to the NARRPR website.
        
        Returns:
            bool: True if login successful, False otherwise
        """
        try:
            logger.info("Attempting to login to NARRPR")
            self.driver.get(f"{self.base_url}/home")
            
            # Wait for login form to appear
            username_field = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "login-email"))
            )
            password_field = self.driver.find_element(By.ID, "login-password")
            login_button = self.driver.find_element(By.ID, "login-button")
            
            # Enter credentials
            username_field.clear()
            username_field.send_keys(self.username)
            password_field.clear()
            password_field.send_keys(self.password)
            
            # Click login button
            login_button.click()
            
            # Wait for login to complete and verify
            time.sleep(5)  # Allow time for redirection
            
            # Check if login successful by looking for dashboard in URL
            if "dashboard" in self.driver.current_url:
                logger.info("Login successful")
                self.is_logged_in = True
                # Save cookies for session management
                self.cookies = self.driver.get_cookies()
                return True
            else:
                logger.error("Login failed - dashboard not found in URL")
                self.is_logged_in = False
                return False
                
        except TimeoutException:
            logger.error("Login timed out - elements not found within time limit")
            return False
        except NoSuchElementException as e:
            logger.error(f"Login failed - element not found: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Login failed with unexpected error: {str(e)}")
            return False
    
    def restore_session(self):
        """
        Restore a previous session using saved cookies.
        
        Returns:
            bool: True if session restored successfully, False otherwise
        """
        if not hasattr(self, 'cookies') or not self.cookies:
            logger.warning("No saved cookies found to restore session")
            return False
        
        try:
            self.driver.get(self.base_url)
            
            # Add saved cookies
            for cookie in self.cookies:
                self.driver.add_cookie(cookie)
            
            # Verify session by navigating to dashboard
            self.driver.get(f"{self.base_url}/dashboard")
            time.sleep(3)
            
            # Check if still logged in
            if "dashboard" in self.driver.current_url:
                logger.info("Session restored successfully")
                self.is_logged_in = True
                return True
            else:
                logger.warning("Failed to restore session - needs new login")
                return self.login()
                
        except Exception as e:
            logger.error(f"Error restoring session: {str(e)}")
            return False
    
    def check_login_status(self):
        """
        Check if the current session is still logged in.
        
        Returns:
            bool: True if still logged in, False otherwise
        """
        if not self.is_logged_in:
            return False
            
        try:
            # Try accessing a protected page
            self.driver.get(f"{self.base_url}/dashboard")
            time.sleep(2)
            
            # Check if redirected to login page
            if "login" in self.driver.current_url:
                logger.warning("Session expired - need to login again")
                self.is_logged_in = False
                return self.login()
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking login status: {str(e)}")
            self.is_logged_in = False
            return False
    
    def scrape_reports(self):
        """
        Navigate to the reports section and scrape report data.
        
        Returns:
            list: List of dictionaries containing report data
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot scrape reports.")
            return []
        
        try:
            logger.info("Navigating to reports section")
            self.driver.get(f"{self.base_url}/reports-v2")
            
            # Wait for reports to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "report-item"))
            )
            
            # Scrape report data
            reports_data = []
            report_items = self.driver.find_elements(By.CLASS_NAME, "report-item")
            
            logger.info(f"Found {len(report_items)} reports")
            
            for report in report_items:
                try:
                    report_data = {}
                    
                    # Extract report title and date
                    report_data['title'] = report.find_element(By.CLASS_NAME, "report-title").text
                    report_data['date'] = report.find_element(By.CLASS_NAME, "report-date").text
                    
                    # Try to extract additional details if available
                    try:
                        report_data['address'] = report.find_element(By.CLASS_NAME, "property-address").text
                    except NoSuchElementException:
                        report_data['address'] = "Not available"
                        
                    try:
                        report_data['price'] = report.find_element(By.CLASS_NAME, "property-price").text
                    except NoSuchElementException:
                        report_data['price'] = "Not available"
                    
                    reports_data.append(report_data)
                    
                except Exception as e:
                    logger.warning(f"Error extracting data from report: {str(e)}")
                    continue
            
            return reports_data
            
        except TimeoutException:
            logger.error("Timed out waiting for reports to load")
            return []
        except Exception as e:
            logger.error(f"Error scraping reports: {str(e)}")
            return []
    
    def navigate_to_property_details(self, property_id):
        """
        Navigate to a specific property details page and extract information.
        
        Args:
            property_id (str): The ID of the property to view
            
        Returns:
            dict: Dictionary containing property details
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot access property details.")
            return {}
        
        try:
            property_url = f"{self.base_url}/property/{property_id}"
            self.driver.get(property_url)
            
            # Wait for property details to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "property-details"))
            )
            
            # Extract property details
            property_data = {}
            
            # Basic details
            property_data['address'] = self.driver.find_element(By.CLASS_NAME, "property-address").text
            property_data['price'] = self.driver.find_element(By.CLASS_NAME, "property-price").text
            
            # Additional details - adjust selectors as needed based on actual website structure
            details_section = self.driver.find_element(By.CLASS_NAME, "property-details")
            detail_items = details_section.find_elements(By.CLASS_NAME, "detail-item")
            
            for item in detail_items:
                try:
                    key = item.find_element(By.CLASS_NAME, "detail-label").text.strip(':')
                    value = item.find_element(By.CLASS_NAME, "detail-value").text
                    property_data[key] = value
                except Exception:
                    pass
            
            return property_data
            
        except Exception as e:
            logger.error(f"Error navigating to property details: {str(e)}")
            return {}
    
    def save_to_csv(self, data, filename="narrpr_data.csv"):
        """
        Save scraped data to a CSV file.
        
        Args:
            data (list): List of dictionaries containing scraped data
            filename (str): Name of the CSV file to save
            
        Returns:
            str: Path to the saved CSV file
        """
        if not data:
            logger.warning("No data to save to CSV")
            return None
        
        try:
            # Create directory if it doesn't exist
            output_dir = "output"
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            
            file_path = os.path.join(output_dir, filename)
            
            # Convert data to DataFrame and save to CSV
            df = pd.DataFrame(data)
            df.to_csv(file_path, index=False)
            
            logger.info(f"Data saved to {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Error saving data to CSV: {str(e)}")
            return None
    
    def close(self):
        """Close the WebDriver and cleanup resources."""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("WebDriver closed successfully")
            except Exception as e:
                logger.error(f"Error closing WebDriver: {str(e)}")
