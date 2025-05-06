"""
Test script for determining available Zillow API endpoints
"""
import os
import json
import logging
import requests
import time
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API key from the JavaScript example
API_KEY = "451301875bmsh347cde0b3c6bf7ep1fad23jsn9f94e7d04b55"
HOST = "zillow-working-api.p.rapidapi.com"

def test_endpoint(endpoint: str, params: Dict[str, Any] = None) -> bool:
    """Test if an API endpoint is available"""
    url = f"https://{HOST}/{endpoint}"
    
    headers = {
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": HOST
    }
    
    try:
        logger.info(f"Testing endpoint: {endpoint}")
        response = requests.get(url, headers=headers, params=params)
        status = response.status_code
        
        if status == 200:
            logger.info(f"SUCCESS: Endpoint {endpoint} returned 200 OK")
            # Try to parse JSON response
            try:
                data = response.json()
                logger.info(f"Response keys: {list(data.keys())}")
                # Save response to file
                with open(f"response_{endpoint.replace('/', '_')}.json", "w") as f:
                    json.dump(data, f, indent=2)
            except Exception as e:
                logger.warning(f"Couldn't parse JSON response: {e}")
            return True
        else:
            logger.warning(f"Endpoint {endpoint} returned status {status}")
            return False
    except Exception as e:
        logger.error(f"Error testing endpoint {endpoint}: {e}")
        return False

def main():
    """Test multiple Zillow API endpoints to find working ones"""
    # Sample ZPID for testing
    zpid = "32311594"  # Walla Walla property
    
    # Let's test just a few essential endpoints rather than all of them at once
    # This reduces the risk of hitting rate limits or timeouts
    primary_endpoints = [
        # From the example we have
        {"endpoint": "apartment_details", "params": {
            "bylotid": "1001422626", 
            "byapturl": "https://www.zillow.com/apartments/nashville-tn/parkwood-villa/5XhxdJ/"
        }},
        
        # Most common property details endpoints
        {"endpoint": "property", "params": {"zpid": zpid}},
        {"endpoint": "property_details", "params": {"zpid": zpid}},
        
        # Try converting from kebab-case to snake_case (common API convention)
        {"endpoint": "property_lookup", "params": {"zpid": zpid}}
    ]
    
    success_count = 0
    
    logger.info(f"Testing {len(primary_endpoints)} primary Zillow API endpoints")
    
    # Test each endpoint with a delay between requests
    for item in primary_endpoints:
        endpoint = item["endpoint"]
        params = item["params"]
        
        # Add delay between requests to avoid rate limiting
        if success_count > 0:
            logger.info("Waiting 2 seconds before next request...")
            time.sleep(2)
            
        success = test_endpoint(endpoint, params)
        if success:
            success_count += 1
            logger.info(f"✓ SUCCESS: {endpoint} endpoint works!")
        else:
            logger.info(f"✗ FAILED: {endpoint} endpoint not available")
    
    logger.info(f"Endpoint testing complete. Found {success_count} working endpoints out of {len(primary_endpoints)}")

if __name__ == "__main__":
    main()