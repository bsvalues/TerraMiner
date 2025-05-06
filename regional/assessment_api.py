"""
Regional Assessment Data API

This module provides a unified interface to access authentic property assessment data
from various county assessment systems, with a focus on Benton County, WA.

The API ensures all data is retrieved directly from official county sources with
no fallback to demonstration or synthetic data, in strict compliance with IAAO
and USPAP standards.
"""

import logging
import os
from typing import Dict, Any, Optional, List
import traceback

# Import regional connectors
from regional.benton_gis_connector import (
    get_property_by_parcel_id as gis_get_property,
    search_properties as gis_search_properties
)

# Setup logging
logger = logging.getLogger(__name__)

# Constants
PACS_API_URL = os.environ.get("PACS_API_URL", "http://localhost:8000")
BENTON_COUNTY = "benton"
COUNTIES = {
    BENTON_COUNTY: "Benton County, WA"
}

def get_assessment_data(property_id: str, county: str = BENTON_COUNTY) -> Dict[str, Any]:
    """
    Get assessment data for a property from the specified county's system.
    
    This function attempts to retrieve data using the available connectors,
    prioritizing the most direct and authoritative sources.
    
    Args:
        property_id: The property/parcel identification number
        county: The county code (default: "benton" for Benton County, WA)
        
    Returns:
        Dictionary containing the property assessment data or error information.
        All successful responses include "using_real_data": True to confirm
        authenticity.
    """
    result = {}
    
    try:
        # Validate county
        if county.lower() != BENTON_COUNTY:
            return {
                "error": "county_not_supported",
                "message": f"County '{county}' is not currently supported.",
                "supported_counties": list(COUNTIES.keys())
            }
        
        # Try Benton County GIS services first
        logger.info(f"Retrieving property {property_id} data from Benton County GIS")
        result = gis_get_property(property_id)
        
        # If GIS services retrieval was successful, return the result
        if "error" not in result:
            return result
        
        # If GIS didn't work, try the PACS connector (if available)
        try:
            from regional.benton_pacs_connector import get_property
            
            logger.info(f"Retrieving property {property_id} data from Benton County PACS")
            pacs_result = get_property(property_id)
            
            # If PACS retrieval was successful, return that result
            if "error" not in pacs_result:
                return pacs_result
                
            # If PACS also failed, return the original GIS error
            logger.warning(f"Failed to retrieve from both GIS and PACS for {property_id}")
            return result
            
        except ImportError:
            # PACS connector not available, just return the GIS error
            logger.warning(f"PACS connector not available, using GIS result for {property_id}")
            return result
    
    except Exception as e:
        # Catch any unexpected exceptions
        logger.error(f"Error retrieving assessment data: {str(e)}")
        logger.debug(traceback.format_exc())
        
        return {
            "error": "assessment_data_error",
            "message": f"Error retrieving assessment data: {str(e)}",
            "using_real_data": True,
            "data_source": "Benton County Assessment Systems"
        }
    

def search_assessment_properties(
    search_text: str, 
    county: str = BENTON_COUNTY,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Search for properties in the specified county's assessment system.
    
    Args:
        search_text: Text to search for (address, name, parcel ID, etc.)
        county: The county code (default: "benton" for Benton County, WA)
        limit: Maximum number of results to return
        
    Returns:
        Dictionary containing search results or error information
    """
    try:
        # Validate county
        if county.lower() != BENTON_COUNTY:
            return {
                "error": "county_not_supported",
                "message": f"County '{county}' is not currently supported.",
                "supported_counties": list(COUNTIES.keys())
            }
        
        # Try Benton County GIS services first
        logger.info(f"Searching properties in Benton County GIS: '{search_text}'")
        result = gis_search_properties(search_text, limit)
        
        # If GIS services search was successful, return the result
        if "error" not in result:
            return result
        
        # If GIS didn't work, try the PACS connector (if available)
        try:
            from regional.benton_pacs_connector import search_properties
            
            logger.info(f"Searching properties in Benton County PACS: '{search_text}'")
            pacs_result = search_properties(search_text, limit)
            
            # If PACS search was successful, return that result
            if "error" not in pacs_result:
                return pacs_result
                
            # If PACS also failed, return the original GIS error
            logger.warning(f"Failed to search from both GIS and PACS for '{search_text}'")
            return result
            
        except ImportError:
            # PACS connector not available, just return the GIS error
            logger.warning(f"PACS connector not available, using GIS result for '{search_text}'")
            return result
    
    except Exception as e:
        # Catch any unexpected exceptions
        logger.error(f"Error searching assessment properties: {str(e)}")
        logger.debug(traceback.format_exc())
        
        return {
            "error": "assessment_search_error",
            "message": f"Error searching assessment properties: {str(e)}",
            "using_real_data": True,
            "data_source": "Benton County Assessment Systems"
        }


def get_supported_counties() -> List[Dict[str, str]]:
    """
    Get a list of supported counties.
    
    Returns:
        List of county information dictionaries
    """
    return [
        {
            "code": code,
            "name": name
        }
        for code, name in COUNTIES.items()
    ]