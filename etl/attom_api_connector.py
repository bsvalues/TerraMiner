"""
ATTOM Property Data API connector

This connector provides access to ATTOM's comprehensive property data API,
which includes property characteristics, ownership, sales history, tax data,
and more across the United States.
"""

import os
import json
import logging
import requests
import time
from typing import Dict, Any, Optional, List, Union

from etl.base_api_connector import BaseApiConnector

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class AttomApiConnector(BaseApiConnector):
    """
    Connector for the ATTOM Property Data API.
    
    ATTOM provides one of the most comprehensive property data sets in the US,
    including detailed information on over 155 million properties.
    """
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        """
        Initialize the ATTOM API connector.
        
        Args:
            api_key (str, optional): ATTOM API key
            **kwargs: Additional connector-specific configuration options
        """
        super().__init__(**kwargs)
        
        # Set API key, using environment variable as fallback
        self.api_key = api_key or os.environ.get('ATTOM_API_KEY')
        if not self.api_key:
            logger.warning("No ATTOM API key provided or found in environment")
            return
        
        # API configuration
        self.base_url = "https://api.gateway.attomdata.com/propertyapi/v1.0.0"
        
        # API endpoint mapping
        self.endpoints = {
            'property': 'property/detail',
            'search': 'property/address',
            'sale': 'sale/detail',
            'assessment': 'assessment/detail',
            'avm': 'property/expandedprofile',
            'school': 'school/snapshot',
            'neighborhood': 'neighborhood/detail',
        }
        
        # API headers
        self.headers = {
            'apikey': self.api_key,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        self.min_request_interval = kwargs.get('min_request_interval', 1.0)
        self.source_priority = kwargs.get('priority', 'primary')
        self.is_authenticated = True
        logger.info("ATTOM API connector initialized successfully")
    
    def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a request to the ATTOM API.
        
        Args:
            endpoint (str): API endpoint to call
            params (dict): Query parameters
        
        Returns:
            dict: Response data
        """
        if not self.is_authenticated:
            logger.warning("ATTOM API connector is not authenticated")
            return {"error": "Not authenticated"}
        
        url = f"{self.base_url}/{endpoint}"
        self._throttle_requests()
        
        try:
            start_time = time.time()
            self.last_request_time = start_time
            self.metrics['requests'] += 1
            
            response = requests.get(
                url,
                headers=self.headers,
                params=params,
                timeout=30
            )
            
            elapsed = time.time() - start_time
            self.metrics['total_response_time'] += elapsed
            
            # Check for rate limiting
            if response.status_code == 429:
                logger.warning("ATTOM API rate limit reached")
                self.metrics['rate_limit_hits'] += 1
                return {"error": "Rate limit exceeded"}
            
            # Check for other errors
            if response.status_code != 200:
                logger.error(f"ATTOM API error: {response.status_code}: {response.text}")
                self.metrics['errors'] += 1
                return {"error": f"API error: {response.status_code}"}
            
            # Parse response
            data = response.json()
            return data
            
        except requests.exceptions.Timeout:
            logger.error("ATTOM API request timed out")
            self.metrics['timeouts'] += 1
            return {"error": "Request timed out"}
            
        except Exception as e:
            logger.error(f"ATTOM API request error: {str(e)}")
            self.metrics['errors'] += 1
            return {"error": f"Request error: {str(e)}"}
    
    def search_properties(self, address: str = None, city: str = None, 
                          state: str = None, zipcode: str = None, 
                          radius: float = 0.1) -> List[Dict[str, Any]]:
        """
        Search for properties by address components.
        
        Args:
            address (str, optional): Street address
            city (str, optional): City name
            state (str, optional): State code
            zipcode (str, optional): ZIP code
            radius (float, optional): Search radius in miles
        
        Returns:
            list: List of matching properties
        """
        params = {}
        
        # Build address search parameters
        if address:
            params['address'] = address
        
        if city:
            params['city'] = city
            
        if state:
            params['state'] = state
            
        if zipcode:
            params['zipcode'] = zipcode
        
        # Must have at least one search parameter
        if not params:
            logger.warning("No search parameters provided")
            return []
        
        # Add search radius
        params['radius'] = str(radius)
        
        # Make the request
        response = self._make_request(self.endpoints['search'], params)
        
        if 'error' in response:
            return []
        
        try:
            # Extract property data from response
            properties = response.get('property', [])
            return properties
        except Exception as e:
            logger.error(f"Error processing ATTOM property search results: {str(e)}")
            return []
    
    def get_property_details(self, property_id: str = None, address: str = None, 
                             zipcode: str = None) -> Dict[str, Any]:
        """
        Get detailed property information.
        
        Args:
            property_id (str, optional): ATTOM property ID
            address (str, optional): Street address
            zipcode (str, optional): ZIP code
        
        Returns:
            dict: Property details
        """
        params = {}
        
        # Either property_id or (address and zipcode) are required
        if property_id:
            params['attomId'] = property_id
        elif address and zipcode:
            params['address'] = address
            params['zipcode'] = zipcode
        else:
            logger.warning("Either property_id or address+zipcode must be provided")
            return {}
        
        # Make the request
        response = self._make_request(self.endpoints['property'], params)
        
        if 'error' in response:
            return {}
        
        try:
            # Extract property data from response
            properties = response.get('property', [])
            if properties:
                return properties[0]
            return {}
        except Exception as e:
            logger.error(f"Error processing ATTOM property details: {str(e)}")
            return {}
    
    def get_property_sales(self, property_id: str = None, address: str = None, 
                          zipcode: str = None) -> Dict[str, Any]:
        """
        Get property sales history.
        
        Args:
            property_id (str, optional): ATTOM property ID
            address (str, optional): Street address
            zipcode (str, optional): ZIP code
        
        Returns:
            dict: Sales history
        """
        params = {}
        
        # Either property_id or (address and zipcode) are required
        if property_id:
            params['attomId'] = property_id
        elif address and zipcode:
            params['address'] = address
            params['zipcode'] = zipcode
        else:
            logger.warning("Either property_id or address+zipcode must be provided")
            return {}
        
        # Make the request
        response = self._make_request(self.endpoints['sale'], params)
        
        if 'error' in response:
            return {}
        
        try:
            # Extract sale data from response
            properties = response.get('property', [])
            if properties:
                return properties[0]
            return {}
        except Exception as e:
            logger.error(f"Error processing ATTOM sales data: {str(e)}")
            return {}
    
    def get_property_valuation(self, property_id: str = None, address: str = None, 
                              zipcode: str = None) -> Dict[str, Any]:
        """
        Get automated valuation model (AVM) data for a property.
        
        Args:
            property_id (str, optional): ATTOM property ID
            address (str, optional): Street address
            zipcode (str, optional): ZIP code
        
        Returns:
            dict: Property valuation data
        """
        params = {}
        
        # Either property_id or (address and zipcode) are required
        if property_id:
            params['attomId'] = property_id
        elif address and zipcode:
            params['address'] = address
            params['zipcode'] = zipcode
        else:
            logger.warning("Either property_id or address+zipcode must be provided")
            return {}
        
        # Make the request
        response = self._make_request(self.endpoints['avm'], params)
        
        if 'error' in response:
            return {}
        
        try:
            # Extract AVM data from response
            properties = response.get('property', [])
            if properties:
                return properties[0]
            return {}
        except Exception as e:
            logger.error(f"Error processing ATTOM valuation data: {str(e)}")
            return {}
    
    def get_neighborhood_data(self, property_id: str = None, address: str = None, 
                             zipcode: str = None) -> Dict[str, Any]:
        """
        Get neighborhood information for a property.
        
        Args:
            property_id (str, optional): ATTOM property ID
            address (str, optional): Street address
            zipcode (str, optional): ZIP code
        
        Returns:
            dict: Neighborhood data
        """
        params = {}
        
        # Either property_id or (address and zipcode) are required
        if property_id:
            params['attomId'] = property_id
        elif address and zipcode:
            params['address'] = address
            params['zipcode'] = zipcode
        else:
            logger.warning("Either property_id or address+zipcode must be provided")
            return {}
        
        # Make the request
        response = self._make_request(self.endpoints['neighborhood'], params)
        
        if 'error' in response:
            return {}
        
        try:
            # Extract neighborhood data from response
            return response.get('neighborhood', {})
        except Exception as e:
            logger.error(f"Error processing ATTOM neighborhood data: {str(e)}")
            return {}
    
    def get_property_history(self, property_id: str) -> List[Dict[str, Any]]:
        """
        Get property history (sales, loans, tax assessments).
        
        Args:
            property_id (str): Property identifier
        
        Returns:
            list: Property history events
        """
        # Get sales history
        sales_data = self.get_property_sales(property_id=property_id)
        
        history = []
        
        # Extract sales history
        sale_transactions = sales_data.get('saleTransactions', [])
        for sale in sale_transactions:
            history.append({
                'event_type': 'sale',
                'event_date': sale.get('recordingDate'),
                'new_value': sale.get('amount', {}).get('saleAmt'),
                'source': 'attom',
                'description': f"Property sold for ${sale.get('amount', {}).get('saleAmt', 0):,}",
                'details': sale
            })
        
        return history
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get connector performance metrics."""
        # Calculate average response time
        avg_response_time = 0
        if self.metrics['requests'] > 0:
            avg_response_time = self.metrics['total_response_time'] / self.metrics['requests']
        
        return {
            'requests': self.metrics['requests'],
            'errors': self.metrics['errors'],
            'timeouts': self.metrics['timeouts'],
            'rate_limit_hits': self.metrics['rate_limit_hits'],
            'avg_response_time': round(avg_response_time, 3)
        }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get connector health status."""
        if not self.is_authenticated:
            return {
                'status': 'critical',
                'message': 'Not authenticated - API key missing or invalid',
                'healthy': False
            }
        
        # Calculate error rate
        error_rate = 0
        if self.metrics['requests'] > 0:
            error_rate = (self.metrics['errors'] / self.metrics['requests']) * 100
        
        # Determine status based on error rate
        if error_rate > 20:
            status = 'critical'
            healthy = False
            message = f'High error rate: {error_rate:.1f}%'
        elif error_rate > 5:
            status = 'degraded'
            healthy = True
            message = f'Elevated error rate: {error_rate:.1f}%'
        else:
            status = 'healthy'
            healthy = True
            message = 'Connector operating normally'
        
        return {
            'status': status,
            'message': message,
            'healthy': healthy,
            'error_rate': error_rate,
            'authenticated': self.is_authenticated
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test the connection to the ATTOM API.
        
        Returns:
            dict: Test results
        """
        if not self.is_authenticated:
            return {
                'success': False,
                'message': 'Not authenticated - API key missing or invalid'
            }
        
        # Try a simple request
        try:
            # Test with a known address
            params = {
                'address': '1600 Pennsylvania Ave',
                'city': 'Washington',
                'state': 'DC',
            }
            
            start_time = time.time()
            response = self._make_request(self.endpoints['search'], params)
            elapsed = time.time() - start_time
            
            if 'error' in response:
                return {
                    'success': False,
                    'message': f"API error: {response['error']}",
                    'response_time': elapsed
                }
            
            properties = response.get('property', [])
            if properties:
                return {
                    'success': True,
                    'message': f"Successfully connected to ATTOM API. Found {len(properties)} properties.",
                    'response_time': elapsed
                }
            else:
                return {
                    'success': True,
                    'message': "Successfully connected to ATTOM API, but no properties found for test address.",
                    'response_time': elapsed
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f"Connection test failed: {str(e)}"
            }