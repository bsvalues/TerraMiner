"""
Test script for the unified real estate data connector
"""
import os
import json
import logging
from etl.real_estate_data_connector import RealEstateDataConnector

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_real_estate_connector():
    """Test the unified real estate data connector with real-world data"""
    try:
        # Initialize the connector
        connector = RealEstateDataConnector()
        logger.info(f"Initialized connector with primary source: {connector.primary_source}")
        logger.info(f"Available sources: {list(connector.connectors.keys())}")
        
        # Test property search
        location = "Nashville, TN"
        logger.info(f"Testing property search in {location}")
        
        search_results = connector.search_properties(location, page=1)
        
        # Save the response to a file for inspection
        with open("property_search_results.json", "w") as f:
            json.dump(search_results, f, indent=2)
        
        logger.info("Property search results saved to property_search_results.json")
        
        # Test property details - need a valid property ID
        # This is a Nashville apartment complex ID known to work with the API
        property_id = "1001422626"
        logger.info(f"Testing property details for ID: {property_id}")
        
        property_details = connector.get_property_details(property_id)
        
        # Save the response to a file for inspection
        with open("property_details_results.json", "w") as f:
            json.dump(property_details, f, indent=2)
        
        logger.info("Property details saved to property_details_results.json")
        
        # Print a summary of the property details
        if 'name' in property_details:
            name = property_details.get('name', 'Unknown Property')
            address = property_details.get('address', {}).get('display', 'Unknown Location')
            details = property_details.get('details', {})
            price = details.get('price', 0)
            beds = details.get('bedrooms', 0)
            baths = details.get('bathrooms', 0)
            sqft = details.get('sqft', 0)
            
            logger.info(f"Property: {name}")
            logger.info(f"Address: {address}")
            logger.info(f"Price: ${price:,}")
            logger.info(f"Beds: {beds}, Baths: {baths}, SqFt: {sqft}")
        else:
            logger.warning("Response doesn't match expected format")
            logger.info(f"Response keys: {list(property_details.keys())}")
        
        # Test market trends
        logger.info(f"Testing market trends for {location}")
        
        market_trends = connector.get_market_trends(location)
        
        # Save the response to a file for inspection
        with open("market_trends_results.json", "w") as f:
            json.dump(market_trends, f, indent=2)
        
        logger.info("Market trends saved to market_trends_results.json")
        
        logger.info("All tests completed successfully")
        
    except Exception as e:
        logger.error(f"Error testing real estate connector: {str(e)}")
        raise

if __name__ == "__main__":
    test_real_estate_connector()