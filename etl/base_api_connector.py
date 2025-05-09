"""
Base API connector for real estate data sources
"""
import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class BaseApiConnector(ABC):
    """Base class for all real estate API connectors"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the base API connector.
        
        Args:
            api_key (str, optional): API key for the service (default: from environment)
        """
        self.api_key = api_key
        
    @abstractmethod
    def search_properties(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Search for properties in a specific location.
        
        Args:
            location (str): Location to search (city, zip code, address, etc.)
            **kwargs: Additional search parameters specific to the API
        
        Returns:
            Dict[str, Any]: Search results from the API
        """
        pass
    
    @abstractmethod
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific property.
        
        Args:
            property_id (str): Property identifier specific to the API
        
        Returns:
            Dict[str, Any]: Property details from the API
        """
        pass
    
    @abstractmethod
    def get_market_trends(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Get market trends for a specific location.
        
        Args:
            location (str): Location to analyze (city, zip code, etc.)
            **kwargs: Additional parameters specific to the API
        
        Returns:
            Dict[str, Any]: Market trend data from the API
        """
        pass
    
    def standardize_property(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardize API-specific property data to a common format.
        Should be implemented by each specific API connector.
        
        Args:
            data (Dict[str, Any]): Raw property data from the API
        
        Returns:
            Dict[str, Any]: Standardized property data
        """
        # Default implementation returns unchanged data
        # Subclasses should override this to standardize the data
        return data
    
    @staticmethod
    def handle_error(response_data: Dict[str, Any]) -> None:
        """
        Check for error messages in API response and raise appropriate exceptions.
        
        Args:
            response_data (Dict[str, Any]): API response data to check for errors
        
        Raises:
            ValueError: If an error is found in the response
        """
        # Default implementation - subclasses may override with API-specific logic
        if isinstance(response_data, dict) and 'error' in response_data:
            raise ValueError(f"API error: {response_data['error']}")