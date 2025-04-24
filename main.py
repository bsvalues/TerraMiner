import os
import logging
from datetime import datetime
from app import app
from etl.narrpr_scraper import NarrprScraper
from etl.zillow_scraper import ZillowScraper
from etl.manager import etl_manager
from db.database import save_to_database
from utils.logger import setup_logger
from utils.config import load_config
from utils.api_monitoring import setup_monitoring
from utils.system_monitor import start_monitoring
from ai.api.prompt_endpoints import register_endpoints as register_prompt_endpoints
from ai.api.learning_endpoints import register_endpoints as register_learning_endpoints
from ai.api.integration_endpoints import register_endpoints as register_integration_endpoints
from ai.api.monitoring_endpoints import register_endpoints as register_monitoring_endpoints

# Register AI endpoints
register_prompt_endpoints(app)
register_learning_endpoints(app)
register_integration_endpoints(app)
register_monitoring_endpoints(app)

# Setup API monitoring
setup_monitoring(app)

# Start system monitoring (collect metrics every 5 minutes)
with app.app_context():
    start_monitoring(interval=300)

# Set up logging
setup_logger()
logger = logging.getLogger(__name__)

def run_etl_workflow(scrape_options=None):
    """
    Main ETL workflow function to execute the NARRPR scraping process.
    
    Args:
        scrape_options (dict, optional): Dictionary containing options for what to scrape:
            - scrape_reports (bool): Whether to scrape reports section
            - property_ids (list): List of property IDs to scrape details for
            - location_ids (list): List of location IDs to scrape market activity for
            - zip_codes (list): List of zip codes to scrape market activity for
            - neighborhood_ids (list): List of neighborhood IDs to scrape data for
            - scrape_valuations (bool): Whether to scrape property valuations for property_ids
            - scrape_comparables (bool): Whether to scrape comparable properties for property_ids
    """
    # Set default scrape options if none provided
    if scrape_options is None:
        scrape_options = {
            'scrape_reports': True,
            'property_ids': [],
            'location_ids': [],
            'zip_codes': [],
            'neighborhood_ids': [],
            'scrape_valuations': False,
            'scrape_comparables': False
        }
    
    logger.info("Starting NARRPR ETL workflow")
    logger.info(f"Scrape options: {scrape_options}")
    
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
            
        # Generate timestamp for filenames
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Dictionary to store all scraped data
        all_data = {}
        
        # 1. Scrape reports if requested
        if scrape_options.get('scrape_reports', True):
            logger.info("Scraping reports data")
            reports_data = narrpr_scraper.scrape_reports()
            
            if reports_data:
                logger.info(f"Scraped {len(reports_data)} reports")
                all_data['reports'] = reports_data
                
                # Save reports data to CSV
                csv_filename = f"narrpr_reports_{timestamp}.csv"
                csv_path = narrpr_scraper.save_to_csv(reports_data, filename=csv_filename)
                logger.info(f"Reports data saved to CSV file: {csv_path}")
                
                # Save reports data to database
                db_result = save_to_database(reports_data, "narrpr_reports")
                if db_result:
                    logger.info("Reports data successfully saved to database")
                else:
                    logger.warning("Failed to save reports data to database")
            else:
                logger.warning("No reports data found")
        
        # 2. Scrape property details if property IDs provided
        property_details = []
        property_ids = scrape_options.get('property_ids', [])
        if property_ids:
            logger.info(f"Scraping property details for {len(property_ids)} properties")
            
            for property_id in property_ids:
                logger.info(f"Scraping details for property ID: {property_id}")
                property_data = narrpr_scraper.navigate_to_property_details(property_id)
                
                if property_data:
                    property_details.append(property_data)
                    logger.info(f"Successfully scraped details for property ID: {property_id}")
                else:
                    logger.warning(f"Failed to scrape details for property ID: {property_id}")
            
            if property_details:
                all_data['property_details'] = property_details
                
                # Save property details to CSV
                csv_filename = f"narrpr_property_details_{timestamp}.csv"
                csv_path = narrpr_scraper.save_to_csv(property_details, filename=csv_filename)
                logger.info(f"Property details saved to CSV file: {csv_path}")
                
                # Save property details to database
                db_result = save_to_database(property_details, "narrpr_property_details")
                if db_result:
                    logger.info("Property details successfully saved to database")
                else:
                    logger.warning("Failed to save property details to database")
            else:
                logger.warning("No property details were scraped")
        
        # 3. Scrape market activity for location IDs
        market_activity_data = []
        location_ids = scrape_options.get('location_ids', [])
        if location_ids:
            logger.info(f"Scraping market activity for {len(location_ids)} locations")
            
            for location_id in location_ids:
                logger.info(f"Scraping market activity for location ID: {location_id}")
                market_data = narrpr_scraper.scrape_market_activity(location_id=location_id)
                
                if market_data:
                    market_activity_data.append(market_data)
                    logger.info(f"Successfully scraped market activity for location ID: {location_id}")
                else:
                    logger.warning(f"Failed to scrape market activity for location ID: {location_id}")
        
        # 4. Scrape market activity for zip codes
        zip_codes = scrape_options.get('zip_codes', [])
        if zip_codes:
            logger.info(f"Scraping market activity for {len(zip_codes)} zip codes")
            
            for zip_code in zip_codes:
                logger.info(f"Scraping market activity for zip code: {zip_code}")
                market_data = narrpr_scraper.scrape_market_activity(zip_code=zip_code)
                
                if market_data:
                    market_activity_data.append(market_data)
                    logger.info(f"Successfully scraped market activity for zip code: {zip_code}")
                else:
                    logger.warning(f"Failed to scrape market activity for zip code: {zip_code}")
        
        # Save market activity data if any was scraped
        if market_activity_data:
            all_data['market_activity'] = market_activity_data
            
            # Save market activity data to CSV
            csv_filename = f"narrpr_market_activity_{timestamp}.csv"
            csv_path = narrpr_scraper.save_to_csv(market_activity_data, filename=csv_filename)
            logger.info(f"Market activity data saved to CSV file: {csv_path}")
            
            # Save market activity data to database
            db_result = save_to_database(market_activity_data, "narrpr_market_activity")
            if db_result:
                logger.info("Market activity data successfully saved to database")
            else:
                logger.warning("Failed to save market activity data to database")
        
        # 5. Scrape neighborhood data
        neighborhood_data = []
        neighborhood_ids = scrape_options.get('neighborhood_ids', [])
        if neighborhood_ids:
            logger.info(f"Scraping data for {len(neighborhood_ids)} neighborhoods")
            
            for neighborhood_id in neighborhood_ids:
                logger.info(f"Scraping data for neighborhood ID: {neighborhood_id}")
                n_data = narrpr_scraper.scrape_neighborhood_data(neighborhood_id)
                
                if n_data:
                    neighborhood_data.append(n_data)
                    logger.info(f"Successfully scraped data for neighborhood ID: {neighborhood_id}")
                else:
                    logger.warning(f"Failed to scrape data for neighborhood ID: {neighborhood_id}")
            
            if neighborhood_data:
                all_data['neighborhood_data'] = neighborhood_data
                
                # Save neighborhood data to CSV
                csv_filename = f"narrpr_neighborhood_data_{timestamp}.csv"
                csv_path = narrpr_scraper.save_to_csv(neighborhood_data, filename=csv_filename)
                logger.info(f"Neighborhood data saved to CSV file: {csv_path}")
                
                # Save neighborhood data to database
                db_result = save_to_database(neighborhood_data, "narrpr_neighborhood_data")
                if db_result:
                    logger.info("Neighborhood data successfully saved to database")
                else:
                    logger.warning("Failed to save neighborhood data to database")
        
        # 6. Scrape property valuations if requested
        valuation_data = []
        if scrape_options.get('scrape_valuations', False) and property_ids:
            logger.info(f"Scraping valuation data for {len(property_ids)} properties")
            
            for property_id in property_ids:
                logger.info(f"Scraping valuation data for property ID: {property_id}")
                v_data = narrpr_scraper.scrape_property_valuation(property_id)
                
                if v_data:
                    valuation_data.append(v_data)
                    logger.info(f"Successfully scraped valuation data for property ID: {property_id}")
                else:
                    logger.warning(f"Failed to scrape valuation data for property ID: {property_id}")
            
            if valuation_data:
                all_data['valuation_data'] = valuation_data
                
                # Save valuation data to CSV
                csv_filename = f"narrpr_valuation_data_{timestamp}.csv"
                csv_path = narrpr_scraper.save_to_csv(valuation_data, filename=csv_filename)
                logger.info(f"Valuation data saved to CSV file: {csv_path}")
                
                # Save valuation data to database
                db_result = save_to_database(valuation_data, "narrpr_property_valuations")
                if db_result:
                    logger.info("Valuation data successfully saved to database")
                else:
                    logger.warning("Failed to save valuation data to database")
        
        # 7. Scrape comparable properties if requested
        comparables_data = []
        if scrape_options.get('scrape_comparables', False) and property_ids:
            logger.info(f"Scraping comparable properties data for {len(property_ids)} properties")
            
            for property_id in property_ids:
                logger.info(f"Scraping comparable properties for property ID: {property_id}")
                c_data = narrpr_scraper.scrape_comparable_properties(property_id)
                
                if c_data:
                    comparables_data.append(c_data)
                    logger.info(f"Successfully scraped comparable properties for property ID: {property_id}")
                else:
                    logger.warning(f"Failed to scrape comparable properties for property ID: {property_id}")
            
            if comparables_data:
                all_data['comparables_data'] = comparables_data
                
                # Save comparables data to CSV
                csv_filename = f"narrpr_comparables_data_{timestamp}.csv"
                csv_path = narrpr_scraper.save_to_csv(comparables_data, filename=csv_filename)
                logger.info(f"Comparable properties data saved to CSV file: {csv_path}")
                
                # Save comparables data to database
                db_result = save_to_database(comparables_data, "narrpr_comparable_properties")
                if db_result:
                    logger.info("Comparable properties data successfully saved to database")
                else:
                    logger.warning("Failed to save comparable properties data to database")
        
        # Close the browser
        narrpr_scraper.close()
        
        # Return success if any data was scraped
        return bool(all_data)
    
    except Exception as e:
        logger.exception(f"Error in ETL workflow: {str(e)}")
        return False

# Run with Flask app if executed directly
if __name__ == "__main__":
    with app.app_context():
        run_etl_workflow()
