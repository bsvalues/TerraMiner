"""
Test script for getting sample property data from the Zillow Apartments API
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

def get_apartment_details():
    """Fetch apartment details from the working endpoint"""
    url = f"https://{HOST}/apartment_details"
    
    # These parameters are from the example and work
    params = {
        "bylotid": "1001422626",
        "byapturl": "https://www.zillow.com/apartments/nashville-tn/parkwood-villa/5XhxdJ/"
    }
    
    headers = {
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": HOST
    }
    
    try:
        logger.info("Fetching apartment details...")
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        logger.info("Successfully retrieved apartment data")
        
        # Extract key values for our property record card
        apartment_details = data.get('apartmentBuildingDetails', {})
        
        # Get address information
        address_component = None
        address_parts = []
        
        # Look for address data
        if apartment_details.get('address'):
            address_component = apartment_details.get('address')
            
        if address_component:
            street = address_component.get('streetAddress', '')
            city = address_component.get('city', '')
            state = address_component.get('state', '')
            zipcode = address_component.get('zipcode', '')
            
            logger.info(f"Address: {street}, {city}, {state} {zipcode}")
        
        # Get pricing information
        price_range = apartment_details.get('priceRange', {})
        min_price = price_range.get('min')
        max_price = price_range.get('max')
        
        if min_price and max_price:
            logger.info(f"Price range: ${min_price} - ${max_price}")
        
        # Get property details
        property_name = apartment_details.get('name', 'Unknown Property')
        property_type = apartment_details.get('buildingType', 'Apartment')
        
        logger.info(f"Property: {property_name} ({property_type})")
        
        # Get photos (if available)
        photos = apartment_details.get('photos', [])
        photo_count = len(photos)
        
        logger.info(f"Photos available: {photo_count}")
        
        # Save the full response for examination
        with open('apartment_data.json', 'w') as f:
            json.dump(data, f, indent=2)
            
        logger.info("Apartment data saved to apartment_data.json")
        
        # Return selected data that could be used for property card
        return {
            "using_real_data": True,
            "data_source": "Zillow Apartment API",
            "PropertyRecord": {
                "ParcelID": "apt-1001422626",
                "ParcelNumber": "1001422626",
                "SitusAddress": street if 'street' in locals() else "Unknown",
                "City": city if 'city' in locals() else "Unknown",
                "State": state if 'state' in locals() else "Unknown",
                "ZipCode": zipcode if 'zipcode' in locals() else "Unknown",
                "PropertyClass": property_type,
                "MarketValue": max_price if 'max_price' in locals() else 0,
            },
            "BuildingData": {
                "SquareFeet": apartment_details.get('minSqft', 0),
                "Stories": apartment_details.get('numStories', 1)
            },
            "Photos": [photo.get('mixedSources', {}).get('jpeg', [{}])[0].get('url', '') 
                      for photo in photos[:3] if photo.get('mixedSources')]
        }
    
    except Exception as e:
        logger.error(f"Error fetching apartment details: {e}")
        return {}

if __name__ == "__main__":
    apartment_data = get_apartment_details()
    if apartment_data:
        logger.info("Successfully extracted property data from apartment API")
        logger.info(f"Address: {apartment_data['PropertyRecord']['SitusAddress']}, {apartment_data['PropertyRecord']['City']}")
        logger.info(f"Property class: {apartment_data['PropertyRecord']['PropertyClass']}")
        logger.info(f"Market value: ${apartment_data['PropertyRecord']['MarketValue']}")
        
        # Print first photo URL if available
        if apartment_data.get('Photos') and len(apartment_data['Photos']) > 0:
            logger.info(f"First photo URL: {apartment_data['Photos'][0]}")
    else:
        logger.error("Failed to get apartment data")