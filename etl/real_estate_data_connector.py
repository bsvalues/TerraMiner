"""
Unified real estate data connector that uses multiple API providers
"""
import os
import json
import logging
from typing import Dict, Any, Optional, List, Union, Tuple

from etl.base_api_connector import BaseApiConnector
from etl.zillow_api_connector import ZillowApiConnector

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class RealEstateDataConnector:
    """
    Unified connector for real estate data from multiple sources.
    
    This class provides a single interface to access data from multiple
    real estate APIs, with automatic failover between sources.
    """
    
    def __init__(self, primary_source: str = 'zillow'):
        """
        Initialize the real estate data connector.
        
        Args:
            primary_source (str): Primary data source to use (default: 'zillow')
        """
        self.connectors = {}
        self.primary_source = primary_source
        
        # Initialize all available connectors
        self._init_connectors()
    
    def _init_connectors(self):
        """Initialize all available API connectors"""
        # Initialize Zillow connector if API key is available
        if os.environ.get('RAPIDAPI_KEY'):
            try:
                self.connectors['zillow'] = ZillowApiConnector()
                logger.info("Initialized Zillow API connector")
            except Exception as e:
                logger.error(f"Failed to initialize Zillow connector: {e}")
        else:
            logger.warning("No RapidAPI key found for Zillow connector")
        
        # Add more connectors here as they become available
        # Example:
        # if os.environ.get('REALTOR_API_KEY'):
        #     self.connectors['realtor'] = RealtorApiConnector()
        
        # If no connectors could be initialized, raise an error
        if not self.connectors:
            raise ValueError("No API connectors could be initialized. Check API keys.")
        
        # Set the primary source, falling back to the first available if specified is not available
        if self.primary_source not in self.connectors:
            # Always list available sources in a fixed order to have a predictable primary
            available_sources = sorted(self.connectors.keys())
            if available_sources:
                self.primary_source = available_sources[0]
                logger.warning(f"Primary source '{self.primary_source}' not available. Using '{available_sources[0]}' instead.")
            else:
                raise ValueError("No real estate API connectors available")
    
    def search_properties(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Search for properties in a specific location using the primary source,
        with automatic failover to secondary sources if the primary fails.
        
        Args:
            location (str): Location to search (city, zip code, address, etc.)
            **kwargs: Additional search parameters
        
        Returns:
            Dict[str, Any]: Search results with metadata about the source used
        """
        result, source = self._execute_with_failover('search_properties', location, **kwargs)
        
        # Add metadata about which source was used
        if 'metadata' not in result:
            result['metadata'] = {}
        result['metadata']['source'] = source
        
        return result
    
    def get_property_details(self, property_id: str, source: Optional[str] = None) -> Dict[str, Any]:
        """
        Get detailed information for a specific property.
        
        Args:
            property_id (str): Property identifier
            source (str, optional): Specific source to use (default: primary source)
        
        Returns:
            Dict[str, Any]: Property details with metadata about the source used
        """
        # If source is specified and available, use it directly
        if source and source in self.connectors:
            try:
                result = self.connectors[source].get_property_details(property_id)
                standardized = self.connectors[source].standardize_property(result)
                
                # Add metadata about which source was used
                if 'metadata' not in standardized:
                    standardized['metadata'] = {}
                standardized['metadata']['source'] = source
                
                return standardized
            except Exception as e:
                logger.error(f"Error getting property details from {source}: {e}")
                # If specified source fails, fall through to failover logic
        
        # Use failover logic if source not specified or failed
        result, used_source = self._execute_with_failover('get_property_details', property_id)
        
        # Add metadata about which source was used
        if 'metadata' not in result:
            result['metadata'] = {}
        result['metadata']['source'] = used_source
        
        return result
    
    def get_market_trends(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Get market trends for a specific location.
        
        Args:
            location (str): Location to analyze (city, zip code, etc.)
            **kwargs: Additional parameters
        
        Returns:
            Dict[str, Any]: Market trend data with metadata about the source used
        """
        result, source = self._execute_with_failover('get_market_trends', location, **kwargs)
        
        # Add metadata about which source was used
        if 'metadata' not in result:
            result['metadata'] = {}
        result['metadata']['source'] = source
        
        return result
    
    def _execute_with_failover(self, method_name: str, *args, **kwargs) -> Tuple[Dict[str, Any], str]:
        """
        Execute a method on the primary source with failover to other sources.
        
        Args:
            method_name (str): Name of the method to execute
            *args: Positional arguments to pass to the method
            **kwargs: Keyword arguments to pass to the method
        
        Returns:
            Tuple[Dict[str, Any], str]: Result and the source that provided it
        
        Raises:
            ValueError: If the method fails on all available sources
        """
        # Try the primary source first
        primary_source = self.primary_source
        try:
            connector = self.connectors[primary_source]
            method = getattr(connector, method_name)
            result = method(*args, **kwargs)
            return connector.standardize_property(result), primary_source
        except Exception as e:
            logger.warning(f"Primary source {primary_source} failed: {e}")
        
        # Try each of the other sources in turn
        errors = {primary_source: str(e)}
        for source, connector in self.connectors.items():
            if source == primary_source:
                continue  # Skip primary source which we already tried
            
            try:
                method = getattr(connector, method_name)
                result = method(*args, **kwargs)
                return connector.standardize_property(result), source
            except Exception as e:
                logger.warning(f"Source {source} failed: {e}")
                errors[source] = str(e)
        
        # If we get here, all sources failed
        error_details = "; ".join([f"{s}: {e}" for s, e in errors.items()])
        raise ValueError(f"All real estate data sources failed: {error_details}")