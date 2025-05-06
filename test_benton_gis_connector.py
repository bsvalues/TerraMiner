"""
Test script for the Benton County GIS connector.

This script tests connectivity to Benton County's GIS services
and retrieves authentic property assessment data.
"""

import logging
import json
from regional.benton_gis_connector import (
    check_gis_connectivity, 
    get_property_by_parcel_id,
    search_properties_by_address,
    search_properties_by_owner,
    get_benton_metadata
)

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_connectivity():
    """Test connectivity to Benton County GIS services."""
    logger.info("Testing connectivity to Benton County GIS services...")
    
    result = check_gis_connectivity()
    
    logger.info(f"Connectivity status: {result['status']}")
    logger.info(f"Message: {result['message']}")
    
    if result['status'] == 'connected':
        logger.info("✓ Successfully connected to Benton County GIS")
        if 'details' in result and result['details']:
            logger.info(f"Service description: {result['details'].get('description', 'N/A')}")
            logger.info(f"Copyright: {result['details'].get('copyright_text', 'N/A')}")
    else:
        logger.error("✗ Failed to connect to Benton County GIS")
        
    return result['status'] == 'connected'

def test_metadata():
    """Test retrieval of Benton County GIS metadata."""
    logger.info("Retrieving Benton County GIS metadata...")
    
    metadata = get_benton_metadata()
    
    if 'error' in metadata:
        logger.error(f"✗ Failed to retrieve metadata: {metadata['message']}")
        return False
        
    logger.info(f"Service name: {metadata.get('service_name', 'N/A')}")
    logger.info(f"Service description: {metadata.get('description', 'N/A')}")
    
    if 'layers' in metadata and metadata['layers']:
        logger.info(f"Available layers ({len(metadata['layers'])}):")
        for idx, layer in enumerate(metadata['layers']):
            logger.info(f"  {idx+1}. {layer.get('name', 'Unknown')} (ID: {layer.get('id', 'N/A')})")
            
    return True

def test_property_lookup(parcel_id):
    """Test property lookup by parcel ID."""
    logger.info(f"Looking up property with parcel ID: {parcel_id}...")
    
    result = get_property_by_parcel_id(parcel_id)
    
    if 'error' in result:
        logger.error(f"✗ Property lookup failed: {result['message']}")
        return False
        
    property_data = result['property_data']
    
    logger.info("✓ Property found")
    logger.info(f"Parcel ID: {property_data.get('parcel_id', 'N/A')}")
    logger.info(f"Address: {property_data.get('address', 'N/A')}")
    logger.info(f"Owner: {property_data.get('owner_name', 'N/A')}")
    logger.info(f"Property type: {property_data.get('property_type', 'N/A')}")
    
    assessment = property_data.get('assessment', {})
    logger.info(f"Total assessed value: ${assessment.get('total_value', 0):,}")
    
    # Verify IAAO compliance information is present
    compliance = property_data.get('compliance', {})
    if compliance and 'iaao_standard' in compliance:
        logger.info("✓ IAAO compliance information present")
    else:
        logger.warning("✗ IAAO compliance information missing")
        
    return True

def test_address_search(address):
    """Test property search by address."""
    logger.info(f"Searching for properties with address containing: {address}...")
    
    result = search_properties_by_address(address)
    
    if 'error' in result:
        logger.error(f"✗ Address search failed: {result['message']}")
        return False
        
    count = result.get('count', 0)
    
    if count == 0:
        logger.warning(f"No properties found matching address: {address}")
        return True
        
    logger.info(f"✓ Found {count} properties")
    
    for idx, property_data in enumerate(result.get('results', [])):
        logger.info(f"  {idx+1}. {property_data.get('address', 'N/A')} - Parcel: {property_data.get('parcel_id', 'N/A')}")
        
    return True

def test_owner_search(owner_name):
    """Test property search by owner name."""
    logger.info(f"Searching for properties owned by: {owner_name}...")
    
    result = search_properties_by_owner(owner_name)
    
    if 'error' in result:
        logger.error(f"✗ Owner search failed: {result['message']}")
        return False
        
    count = result.get('count', 0)
    
    if count == 0:
        logger.warning(f"No properties found for owner: {owner_name}")
        return True
        
    logger.info(f"✓ Found {count} properties")
    
    for idx, property_data in enumerate(result.get('results', [])):
        logger.info(f"  {idx+1}. Owner: {property_data.get('owner_name', 'N/A')} - {property_data.get('address', 'N/A')}")
        
    return True

def run_tests():
    """Run all tests."""
    logger.info("=== BENTON COUNTY GIS CONNECTOR TEST ===")
    
    # Test basic connectivity
    if not test_connectivity():
        logger.error("Connectivity test failed - aborting further tests")
        return False
        
    # Test metadata retrieval
    test_metadata()
    
    # Test property lookup with a sample parcel ID (edit this with a valid Benton County parcel ID)
    test_property_lookup("100934010002000")
    
    # Test address search (edit with a valid Benton County street name)
    test_address_search("WILLIAMS")
    
    # Test owner search (edit with a common last name in Benton County)
    test_owner_search("SMITH")
    
    logger.info("=== TEST COMPLETE ===")
    return True

if __name__ == "__main__":
    run_tests()