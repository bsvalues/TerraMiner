"""
Test script for Benton County GIS connector functionality.

This script tests the ability to retrieve authentic property data
from Benton County's GIS services.
"""

import logging
import json
from regional.benton_gis_connector import (
    get_property_by_parcel_id,
    search_properties,
    get_property_viewer_url
)

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_property_lookup():
    """Test lookup of a specific property by parcel ID."""
    # Test with a known Benton County parcel ID
    # This ID is from a public record and is used for testing only
    test_parcel_id = "118982000001000"
    
    logger.info(f"Looking up property with ID: {test_parcel_id}")
    result = get_property_by_parcel_id(test_parcel_id)
    
    if "error" in result:
        logger.error(f"Error retrieving property: {result['message']}")
        return False
    
    logger.info(f"Successfully retrieved property data:")
    logger.info(f"Data source: {result['data_source']}")
    logger.info(f"Using real data: {result['using_real_data']}")
    
    property_data = result["property_data"]
    logger.info(f"Property address: {property_data['property_address']['street']}, "
                f"{property_data['property_address']['city']}, "
                f"{property_data['property_address']['state']} "
                f"{property_data['property_address']['zip']}")
    
    logger.info(f"Owner: {property_data['owner']['name']}")
    logger.info(f"Total value: ${property_data['assessment']['total_value']:,}")
    
    return True

def test_property_search():
    """Test search functionality with various criteria."""
    search_tests = [
        # Test search by partial address
        "Van Giesen",
        # Test search by city
        "Richland",
        # Test search by owner name (using a common surname)
        "Smith",
        # Test search by parcel ID format
        "11898"
    ]
    
    for search_text in search_tests:
        logger.info(f"\nSearching for properties with: '{search_text}'")
        result = search_properties(search_text, limit=5)
        
        if "error" in result:
            logger.error(f"Error searching properties: {result['message']}")
            continue
        
        logger.info(f"Search returned {result['count']} results")
        logger.info(f"Data source: {result['data_source']}")
        logger.info(f"Using real data: {result['using_real_data']}")
        
        # Display first 3 results
        for i, property_item in enumerate(result["results"][:3], 1):
            logger.info(f"Result {i}:")
            logger.info(f"  Parcel ID: {property_item['parcel_id']}")
            logger.info(f"  Address: {property_item['address']}, {property_item['city']}")
            logger.info(f"  Owner: {property_item['owner_name']}")
            logger.info(f"  Value: ${property_item['total_value']:,}")
            
            # Generate a property viewer URL
            viewer_url = get_property_viewer_url(property_item['parcel_id'])
            logger.info(f"  Viewer URL: {viewer_url}")
    
    return True

def main():
    logger.info("TESTING BENTON COUNTY GIS CONNECTOR")
    logger.info("==================================")
    
    # Test property lookup
    logger.info("\n1. TESTING PROPERTY LOOKUP")
    lookup_success = test_property_lookup()
    
    # Test property search
    logger.info("\n2. TESTING PROPERTY SEARCH")
    search_success = test_property_search()
    
    # Report results
    logger.info("\nTEST RESULTS")
    logger.info("===========")
    logger.info(f"Property Lookup: {'PASSED' if lookup_success else 'FAILED'}")
    logger.info(f"Property Search: {'PASSED' if search_success else 'FAILED'}")

if __name__ == "__main__":
    main()