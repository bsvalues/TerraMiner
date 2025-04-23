"""
Zillow data scraper module for retrieving real estate market data via the RapidAPI.
"""
import os
import json
import logging
import requests
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
        self.api_key = api_key or os.environ.get('RAPIDAPI_KEY')
        
        if not self.api_key:
            logger.warning("No RapidAPI key provided or found in environment. API requests will fail.")
        
        self.base_url = "https://zillow-com1.p.rapidapi.com"
        self.headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "zillow-com1.p.rapidapi.com"
        }
        
        # Create data directory if it doesn't exist
        os.makedirs("output/zillow", exist_ok=True)
    
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
        
        try:
            logger.debug(f"Making request to {url} with params: {params}")
            response = requests.get(url, headers=self.headers, params=params)
            
            # Check if request was successful
            response.raise_for_status()
            
            # Parse response JSON
            data = response.json()
            logger.debug(f"Received response from {url}: {response.status_code}")
            
            return data
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error occurred: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response status code: {e.response.status_code}")
                logger.error(f"Response text: {e.response.text}")
            return {}
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request exception occurred: {e}")
            return {}
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            return {}
    
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
            "beds": beds,
            "propertyTypes": property_types,
            "type": "region",
            "resourceId": resource_id
        }
        
        data = self._make_request("marketData", params)
        
        # Save data to file for debugging/reference
        if data:
            self.save_to_json(data, f"market_data_{resource_id}_{beds}bd_{property_types}.json")
        
        return data
    
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
        
        data = self._make_request("property", params)
        
        # Save data to file for debugging/reference
        if data:
            self.save_to_json(data, f"property_{zpid}.json")
        
        return data
    
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
            "citystatezip": city_state_zip
        }
        
        data = self._make_request("propertyByAddress", params)
        
        # Save data to file for debugging/reference
        if data:
            self.save_to_json(data, f"property_search_{address}_{city_state_zip}.json")
        
        return data
    
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
            "page": page
        }
        
        data = self._make_request("propertyByAddress", params)
        
        # Save data to file for debugging/reference
        if data:
            self.save_to_json(data, f"property_search_{location}_page{page}.json")
        
        return data
    
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
        
        data = self._make_request("similarHomes", params)
        
        # Save data to file for debugging/reference
        if data:
            self.save_to_json(data, f"similar_homes_{zpid}.json")
        
        return data
    
    def save_to_json(self, data: Dict[str, Any], filename: Optional[str] = None) -> str:
        """
        Save data to a JSON file in the data directory.
        
        Args:
            data (Dict[str, Any]): Data to save
            filename (str, optional): Filename to use. If None, one will be generated.
            
        Returns:
            str: Path to the saved file
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"zillow_data_{timestamp}.json"
        
        filepath = os.path.join("output/zillow", filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
            
            logger.debug(f"Saved data to {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Failed to save data to file: {e}")
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
        # Initialize result structure
        result = {
            "location_info": {},
            "market_overview": {},
            "price_trends": []
        }
        
        # Extract location info
        if "locationInfo" in raw_data:
            loc_info = raw_data["locationInfo"]
            result["location_info"] = {
                "name": loc_info.get("name", ""),
                "type": loc_info.get("type", ""),
                "url": loc_info.get("url", ""),
                "state": loc_info.get("state", ""),
                "city": loc_info.get("city", ""),
                "county": loc_info.get("county", "")
            }
        
        # Extract market overview data
        if "marketOverview" in raw_data:
            market_data = raw_data["marketOverview"]
            result["market_overview"] = {
                "median_price": market_data.get("median", 0),
                "median_price_per_sqft": market_data.get("medianPricePerSqft", 0),
                "median_days_on_market": market_data.get("medianDom", 0),
                "avg_days_on_market": market_data.get("avgDom", 0),
                "homes_sold_last_month": market_data.get("homesSoldLastMonth", 0),
                "total_active_listings": market_data.get("totalActiveListings", 0)
            }
        
        # Extract price trends (historical price data)
        if "marketHistoricalData" in raw_data and "median" in raw_data["marketHistoricalData"]:
            trend_data = raw_data["marketHistoricalData"]["median"]
            for point in trend_data:
                if "date" in point and "value" in point and point["value"] is not None:
                    result["price_trends"].append({
                        "date": point["date"],
                        "price": point["value"],
                        "percent_change": point.get("percentChange")
                    })
        
        return result