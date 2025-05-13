"""
Test script for the PACMLS (Paragon Connect MLS) connector.

This script tests the connection and data retrieval from PACMLS.
"""

import os
import json
import logging
import sys
from datetime import datetime
from dotenv import load_dotenv

from etl.pacmls_connector import PacMlsConnector

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

def test_pacmls_connector():
    """Test the PACMLS connector with real credentials."""
    try:
        # Ensure we have the required environment variables
        username = os.environ.get('PACMLS_USERNAME')
        password = os.environ.get('PACMLS_PASSWORD')
        
        if not username or not password:
            logger.error("PACMLS_USERNAME and PACMLS_PASSWORD environment variables are required")
            return False
        
        logger.info(f"Using PACMLS credentials for user: {username}")
        
        # Initialize the connector
        connector = PacMlsConnector(username, password)
        logger.info("PACMLS connector initialized")
        
        # Test property search
        try:
            logger.info("Testing property search in Seattle, WA")
            search_results = connector.search_properties("Seattle, WA", limit=5)
            
            # Save results to a file
            with open("pacmls_search_results.json", "w") as f:
                json.dump(search_results, f, indent=2)
                
            logger.info(f"Property search successful. Found {len(search_results.get('listings', []))} properties")
            logger.info("Results saved to pacmls_search_results.json")
        except Exception as e:
            logger.error(f"Property search failed: {e}")
        
        # Test property details (if we have a property ID)
        property_id = None
        if 'listings' in search_results and search_results['listings']:
            property_id = search_results['listings'][0].get('id')
            
        if property_id:
            try:
                logger.info(f"Testing property details for ID: {property_id}")
                property_details = connector.get_property_details(property_id)
                
                # Save results to a file
                with open("pacmls_property_details.json", "w") as f:
                    json.dump(property_details, f, indent=2)
                    
                logger.info("Property details retrieved successfully")
                logger.info("Results saved to pacmls_property_details.json")
                
                # Test standardization
                std_property = connector.standardize_property(property_details)
                
                # Save standardized results to a file
                with open("pacmls_standardized_property.json", "w") as f:
                    json.dump(std_property, f, indent=2)
                    
                logger.info("Property data standardized successfully")
                logger.info("Results saved to pacmls_standardized_property.json")
            except Exception as e:
                logger.error(f"Property details retrieval failed: {e}")
        else:
            logger.warning("No property ID available for details test")
        
        # Test market trends
        try:
            logger.info("Testing market trends for Seattle, WA")
            market_trends = connector.get_market_trends("Seattle, WA")
            
            # Save results to a file
            with open("pacmls_market_trends.json", "w") as f:
                json.dump(market_trends, f, indent=2)
                
            logger.info("Market trends retrieved successfully")
            logger.info("Results saved to pacmls_market_trends.json")
        except Exception as e:
            logger.error(f"Market trends retrieval failed: {e}")
        
        # Close the connector
        connector.close()
        logger.info("PACMLS connector closed")
        
        return True
    
    except Exception as e:
        logger.error(f"PACMLS connector test failed: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting PACMLS connector test")
    
    success = test_pacmls_connector()
    
    if success:
        logger.info("PACMLS connector test completed successfully")
        sys.exit(0)
    else:
        logger.error("PACMLS connector test failed")
        sys.exit(1)