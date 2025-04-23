"""
Zillow data scraper module for retrieving real estate market data via the RapidAPI.
"""
import os
import logging
import requests
import json
from datetime import datetime
from typing import Dict, List, Any, Optional

# Configure logger
logger = logging.getLogger(__name__)

class ZillowScraper:
    """
    Class to handle Zillow data scraping via RapidAPI.
    """
    
    def __init__(self, api_key=None):
        """
        Initialize the ZillowScraper with API credentials.
        
        Args:
            api_key (str, optional): RapidAPI key. If None, will try to get from environment.
        """
        self.api_key = api_key or os.getenv("RAPIDAPI_KEY")
        self.api_host = "zillow-com1.p.rapidapi.com"
        self.base_url = "https://zillow-com1.p.rapidapi.com"
        
        if not self.api_key:
            logger.error("RapidAPI key not found. Please set RAPIDAPI_KEY environment variable.")
            raise ValueError("RapidAPI key is required")
            
        logger.info("ZillowScraper initialized")
        
    def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a request to the Zillow API.
        
        Args:
            endpoint (str): API endpoint path
            params (Dict[str, Any]): Query parameters for the request
            
        Returns:
            Dict[str, Any]: JSON response from the API
        """
        url = f"{self.base_url}/{endpoint}"
        
        headers = {
            "x-rapidapi-host": self.api_host,
            "x-rapidapi-key": self.api_key
        }
        
        try:
            logger.info(f"Making request to {endpoint} with params: {params}")
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()  # Raise exception for 4XX/5XX responses
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error making request to {endpoint}: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response text: {e.response.text}")
            raise
            
    def get_market_data(self, resource_id: str, beds: int = 0, 
                       property_types: str = "house") -> Dict[str, Any]:
        """
        Get market data for a specific location (zip, city, county, etc).
        
        Args:
            resource_id (str): The Zillow resource ID for the location (zip code, city ID)
            beds (int, optional): Number of bedrooms. Default is 0 (any).
            property_types (str, optional): Property types. Default is "house".
            
        Returns:
            Dict[str, Any]: Market data from Zillow
        """
        params = {
            "resourceId": resource_id,
            "beds": str(beds),
            "propertyTypes": property_types
        }
        
        try:
            return self._make_request("marketData", params)
        except Exception as e:
            logger.error(f"Error getting market data: {str(e)}")
            return {}
            
    def get_property_details(self, zpid: str) -> Dict[str, Any]:
        """
        Get detailed information about a property by its Zillow Property ID (zpid).
        
        Args:
            zpid (str): Zillow Property ID
            
        Returns:
            Dict[str, Any]: Property details from Zillow
        """
        params = {
            "zpid": zpid
        }
        
        try:
            return self._make_request("propertyDetails", params)
        except Exception as e:
            logger.error(f"Error getting property details: {str(e)}")
            return {}
            
    def get_property_by_address(self, address: str, city_state_zip: str) -> Dict[str, Any]:
        """
        Search for a property by its address.
        
        Args:
            address (str): Street address
            city_state_zip (str): City, state, and zip code
            
        Returns:
            Dict[str, Any]: Property information from Zillow
        """
        params = {
            "address": address,
            "cityStateZip": city_state_zip
        }
        
        try:
            return self._make_request("propertyByAddress", params)
        except Exception as e:
            logger.error(f"Error getting property by address: {str(e)}")
            return {}
            
    def search_properties(self, location: str, page: int = 1) -> Dict[str, Any]:
        """
        Search for properties in a given location.
        
        Args:
            location (str): Location to search (city, zip code, etc.)
            page (int, optional): Page number for results pagination. Default is 1.
            
        Returns:
            Dict[str, Any]: Search results from Zillow
        """
        params = {
            "location": location,
            "page": str(page)
        }
        
        try:
            return self._make_request("propertySearch", params)
        except Exception as e:
            logger.error(f"Error searching properties: {str(e)}")
            return {}
            
    def get_similar_homes(self, zpid: str) -> Dict[str, Any]:
        """
        Get similar homes to a given property.
        
        Args:
            zpid (str): Zillow Property ID
            
        Returns:
            Dict[str, Any]: Similar properties from Zillow
        """
        params = {
            "zpid": zpid
        }
        
        try:
            return self._make_request("similarHomes", params)
        except Exception as e:
            logger.error(f"Error getting similar homes: {str(e)}")
            return {}
            
    def save_to_json(self, data: Dict[str, Any], filename: Optional[str] = None) -> str:
        """
        Save data to a JSON file in the data directory.
        
        Args:
            data (Dict[str, Any]): Data to save
            filename (str, optional): Filename to use. If None, one will be generated.
            
        Returns:
            str: Path to the saved file
        """
        # Create data directory if it doesn't exist
        data_dir = os.path.join(os.getcwd(), "data")
        os.makedirs(data_dir, exist_ok=True)
        
        # Generate filename if not provided
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"zillow_data_{timestamp}.json"
            
        file_path = os.path.join(data_dir, filename)
        
        try:
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
                
            logger.info(f"Data saved to {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Error saving data to JSON: {str(e)}")
            return ""
            
    @staticmethod
    def format_market_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format and clean the raw market data from Zillow API.
        
        Args:
            raw_data (Dict[str, Any]): Raw data from the API
            
        Returns:
            Dict[str, Any]: Formatted data
        """
        formatted_data = {
            "location_info": {},
            "market_overview": {},
            "price_trends": [],
            "inventory": {}
        }
        
        # Early return if data is empty or invalid
        if not raw_data or "locationInfo" not in raw_data:
            return formatted_data
            
        # Extract location information
        location_info = raw_data.get("locationInfo", {})
        formatted_data["location_info"] = {
            "id": location_info.get("id"),
            "name": location_info.get("name"),
            "url": location_info.get("url"),
            "type": location_info.get("type"),
            "region_type": location_info.get("regionType")
        }
        
        # Extract market overview data
        market = raw_data.get("market", {})
        formatted_data["market_overview"] = {
            "median_price": market.get("medianPrice"),
            "median_price_per_sqft": market.get("medianPricePerSqft"),
            "median_days_on_market": market.get("medianDaysOnMarket"),
            "avg_days_on_market": market.get("avgDaysOnMarket"),
            "homes_sold_last_month": market.get("homesSoldLastMonth"),
            "total_active_listings": market.get("totalActiveListing")
        }
        
        # Extract price trends
        price_history = raw_data.get("priceHistory", [])
        for entry in price_history:
            formatted_data["price_trends"].append({
                "date": entry.get("date"),
                "price": entry.get("price"),
                "percent_change": entry.get("percentChange")
            })
            
        # Extract inventory data
        inventory = raw_data.get("inventory", {})
        formatted_data["inventory"] = {
            "total": inventory.get("total"),
            "by_price_range": inventory.get("byPriceRange", []),
            "by_property_type": inventory.get("byPropertyType", [])
        }
        
        return formatted_data