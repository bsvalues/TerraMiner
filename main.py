import os
import logging
from datetime import datetime
from app import app
from etl.narrpr_scraper import NarrprScraper
from db.database import save_to_database
from utils.logger import setup_logger
from utils.config import load_config

# Set up logging
setup_logger()
logger = logging.getLogger(__name__)

def run_etl_workflow():
    """Main ETL workflow function to execute the NARRPR scraping process."""
    logger.info("Starting NARRPR ETL workflow")
    
    try:
        # Load configuration
        config = load_config()
        
        # Get credentials from environment variables with fallback to config
        username = os.getenv("NARRPR_USERNAME", config.get("narrpr", {}).get("username"))
        password = os.getenv("NARRPR_PASSWORD", config.get("narrpr", {}).get("password"))
        
        if not username or not password:
            logger.error("NARRPR credentials not found in environment variables or config")
            return False
        
        # Initialize the scraper
        narrpr_scraper = NarrprScraper(username, password)
        
        # Login to NARRPR
        login_success = narrpr_scraper.login()
        if not login_success:
            logger.error("Failed to login to NARRPR")
            return False
        
        # Navigate to reports section and scrape data
        reports_data = narrpr_scraper.scrape_reports()
        if not reports_data:
            logger.warning("No reports data found")
            return False
        
        # Generate timestamp for filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_filename = f"narrpr_reports_{timestamp}.csv"
        
        # Save data to CSV file
        csv_path = narrpr_scraper.save_to_csv(reports_data, filename=csv_filename)
        logger.info(f"Data saved to CSV file: {csv_path}")
        
        # Save data to database
        db_result = save_to_database(reports_data, "narrpr_reports")
        if db_result:
            logger.info("Data successfully saved to database")
        else:
            logger.warning("Failed to save data to database")
        
        # Close the browser
        narrpr_scraper.close()
        
        return True
    
    except Exception as e:
        logger.exception(f"Error in ETL workflow: {str(e)}")
        return False

# Run with Flask app if executed directly
if __name__ == "__main__":
    with app.app_context():
        run_etl_workflow()
