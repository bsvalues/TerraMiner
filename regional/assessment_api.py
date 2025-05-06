"""
Regional assessment API module.

This module provides a unified API for accessing authentic property assessment data
from various regional sources, with a focus on Benton County, Washington.
"""

import logging
import os
from typing import Dict, List, Any, Optional

# Import both PACS and GIS connectors to support multiple data sources
from regional.benton_gis_connector import (
    get_property_by_parcel_id as get_property_from_gis,
    search_properties_by_address as search_properties_by_address_gis,
    search_properties_by_owner as search_properties_by_owner_gis,
    check_gis_connectivity
)

# In the future, we may also import from the PACS connector
# from regional.benton_pacs_connector import (
#     get_property_by_parcel_id as get_property_from_pacs,
#     search_properties as search_properties_pacs
# )

logger = logging.getLogger(__name__)

# List of supported counties
SUPPORTED_COUNTIES = {
    'benton': {
        'name': 'Benton County',
        'state': 'Washington',
        'data_sources': ['GIS', 'PACS']
    },
    'franklin': {
        'name': 'Franklin County',
        'state': 'Washington',
        'data_sources': ['GIS']
    },
    'walla_walla': {
        'name': 'Walla Walla County',
        'state': 'Washington',
        'data_sources': ['GIS']
    }
}

# Environment variable to force a specific data source
FORCE_DATA_SOURCE = os.environ.get('FORCE_ASSESSMENT_DATA_SOURCE', '').upper()

def get_supported_counties() -> Dict[str, Dict[str, Any]]:
    """
    Get list of supported counties.
    
    Returns:
        Dict of county information keyed by county ID
    """
    return SUPPORTED_COUNTIES

def get_assessment_data(property_id: str, county: str = 'benton') -> Dict[str, Any]:
    """
    Get property assessment data by property ID for a specific county.
    
    Args:
        property_id: The property ID to look up
        county: County to search in (default: benton)
        
    Returns:
        Dict containing property data or error information
    """
    county = county.lower()
    
    # Verify county is supported
    if county not in SUPPORTED_COUNTIES:
        return {
            'error': 'unsupported_county',
            'message': f"County '{county}' is not supported. Supported counties are: {', '.join(SUPPORTED_COUNTIES.keys())}",
            'data_source': 'TerraMiner'
        }
    
    # For Benton County, we can use either PACS or GIS
    if county == 'benton':
        # If forced to use a specific data source, honor that
        if FORCE_DATA_SOURCE == 'GIS':
            return get_property_from_gis(property_id)
        elif FORCE_DATA_SOURCE == 'PACS':
            # Will be implemented once PACS connector is complete
            return {
                'error': 'data_source_unavailable',
                'message': 'PACS data source is not yet implemented',
                'data_source': 'Benton County PACS'
            }
        
        # Otherwise try GIS first, then fall back to PACS if needed
        gis_result = get_property_from_gis(property_id)
        
        # If GIS lookup succeeded, return the result
        if 'error' not in gis_result:
            return gis_result
            
        # If GIS lookup failed with a connectivity error, log it and try PACS
        if gis_result.get('error') in ['connection_error', 'api_error']:
            logger.warning(f"GIS lookup failed: {gis_result['message']}, trying PACS...")
            
            # Will be implemented once PACS connector is complete
            # pacs_result = get_property_from_pacs(property_id)
            # return pacs_result
            
            # For now, just return the GIS error
            return gis_result
            
        # If GIS lookup failed for other reasons (like not found), return that result
        return gis_result
    
    # For other counties, fall back to generic data source
    return {
        'error': 'not_implemented',
        'message': f"Assessment data for {SUPPORTED_COUNTIES[county]['name']} is not yet implemented",
        'data_source': f"{SUPPORTED_COUNTIES[county]['name']} Assessor"
    }

def search_assessment_properties(search_query: str, county: str = 'benton', limit: int = 10) -> Dict[str, Any]:
    """
    Search for properties by address or owner name.
    
    Args:
        search_query: The search query (address or owner name)
        county: County to search in (default: benton)
        limit: Maximum number of results to return
        
    Returns:
        Dict containing search results or error information
    """
    county = county.lower()
    
    # Verify county is supported
    if county not in SUPPORTED_COUNTIES:
        return {
            'error': 'unsupported_county',
            'message': f"County '{county}' is not supported. Supported counties are: {', '.join(SUPPORTED_COUNTIES.keys())}",
            'data_source': 'TerraMiner'
        }
    
    # For Benton County
    if county == 'benton':
        # First try searching by address
        address_results = search_properties_by_address_gis(search_query, limit)
        
        # If address search found results, return them
        if 'error' not in address_results and address_results.get('count', 0) > 0:
            return address_results
            
        # If address search failed due to connectivity, log and return error
        if 'error' in address_results and address_results.get('error') in ['connection_error', 'api_error']:
            logger.error(f"Address search failed: {address_results['message']}")
            return address_results
            
        # If no results found by address, try searching by owner name
        logger.info(f"No properties found by address, trying owner search for: {search_query}")
        owner_results = search_properties_by_owner_gis(search_query, limit)
        
        # Return owner search results (might be empty or error)
        return owner_results
    
    # For other counties
    return {
        'error': 'not_implemented',
        'message': f"Property search for {SUPPORTED_COUNTIES[county]['name']} is not yet implemented",
        'data_source': f"{SUPPORTED_COUNTIES[county]['name']} Assessor"
    }

def check_assessment_api_status() -> Dict[str, Any]:
    """
    Check the status of the assessment API and its data sources.
    
    Returns:
        Dict with status information for each data source
    """
    status = {
        'status': 'operational',
        'data_sources': {},
        'message': 'All assessment data sources are operational'
    }
    
    # Check GIS connectivity
    gis_status = check_gis_connectivity()
    status['data_sources']['benton_gis'] = {
        'name': 'Benton County GIS',
        'status': 'up' if gis_status['status'] == 'connected' else 'down',
        'message': gis_status['message']
    }
    
    # Check PACS connectivity (to be implemented)
    status['data_sources']['benton_pacs'] = {
        'name': 'Benton County PACS',
        'status': 'unknown',
        'message': 'PACS connector not yet implemented'
    }
    
    # Update overall status based on individual sources
    if all(src['status'] == 'up' for src in status['data_sources'].values()):
        status['status'] = 'operational'
    elif all(src['status'] == 'down' for src in status['data_sources'].values()):
        status['status'] = 'down'
        status['message'] = 'All assessment data sources are unavailable'
    else:
        status['status'] = 'degraded'
        status['message'] = 'Some assessment data sources are unavailable'
    
    return status