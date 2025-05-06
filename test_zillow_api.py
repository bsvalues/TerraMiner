"""
Test script for Zillow API integration
"""
import os
import json
import logging
from etl.zillow_working_scraper import ZillowWorkingScraper

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_zillow_api():
    """Test the Zillow API integration with a sample property"""
    try:
        # Initialize the Zillow scraper
        zillow_scraper = ZillowWorkingScraper()
        
        # Test with a property ID
        zpid = "32311594"  # Walla Walla property ID
        logger.info(f"Testing Zillow API with property ID: {zpid}")
        
        # Try to fetch property details
        property_details = zillow_scraper.get_property_details(zpid)
        
        # Save the response to a file for inspection
        with open("zillow_api_response.json", "w") as f:
            json.dump(property_details, f, indent=2)
            
        logger.info("Successfully retrieved property data. Response saved to zillow_api_response.json")
        
        # Print a quick summary
        if 'property' in property_details:
            property_info = property_details.get('property', {})
            address = property_info.get('address', {})
            price = property_info.get('price', 0)
            full_address = address.get('streetAddress', '')
            city = address.get('city', '')
            state = address.get('state', '')
            bedrooms = property_info.get('bedrooms', 0)
            bathrooms = property_info.get('bathrooms', 0)
            
            logger.info(f"Property: {full_address}, {city}, {state}")
            logger.info(f"Price: ${price:,}")
            logger.info(f"Bedrooms: {bedrooms}, Bathrooms: {bathrooms}")
        else:
            logger.warning("Response doesn't match expected format")
            logger.info(f"Response keys: {list(property_details.keys())}")
    
    except Exception as e:
        logger.error(f"Error testing Zillow API: {str(e)}")
        raise

if __name__ == "__main__":
    test_zillow_api()