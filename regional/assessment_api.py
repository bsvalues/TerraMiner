"""
Assessment Data API

This module provides functions to fetch real assessment data from property data sources.
It combines county assessment data with information from Zillow and other sources.
"""

import logging
import os
import requests
import json
import traceback
from datetime import datetime
from typing import Dict, Any, Optional

from etl.zillow_scraper import ZillowScraper

logger = logging.getLogger(__name__)

# API configuration for county assessment data
COUNTY_API_CONFIG = {
    'walla_walla': {
        'base_url': 'https://gis.co.walla-walla.wa.us/arcgis/rest/services/Assessor/Property/MapServer/0/query',
        'api_key': os.environ.get('WW_ASSESSOR_API_KEY', ''),
        'format': 'json'
    },
    'benton': {
        'base_url': 'https://api.bentoncounty.gov/v1/assessor/property',
        'api_key': os.environ.get('BENTON_ASSESSOR_API_KEY', ''),
        'format': 'json'
    },
    'franklin': {
        'base_url': 'https://data.franklincountywa.gov/api/property-assessment',
        'api_key': os.environ.get('FRANKLIN_ASSESSOR_API_KEY', ''),
        'format': 'json'
    }
}

# Map of sample property IDs to Zillow Property IDs (zpids)
# This allows us to connect our internal IDs to real data sources
PROPERTY_ZPID_MAP = {
    'ww42': '32311594',  # Example Walla Walla property
    'bt75': '26752151',  # Example Benton county property
    'bt42': '48277209',  # Example Richland property
}

def get_assessment_data(property_id: str, county: str) -> Dict[str, Any]:
    """
    Fetch real assessment data from county API and Zillow API.
    
    Args:
        property_id: ID of the property to retrieve
        county: County name
    
    Returns:
        Assessment data (structured with PropertyRecord, BuildingData, LandData, and AssessmentHistory)
    """
    logger.info(f"Fetching assessment data for property {property_id} in {county} county")
    
    # First try to get data from Zillow API if we have a mapping for this property
    zillow_data = _get_zillow_property_data(property_id)
    if zillow_data:
        logger.info(f"Successfully retrieved property data from Zillow API for {property_id}")
        return zillow_data
    
    # Standardize county name
    county_key = county.lower().replace(' ', '_').replace('-', '_')
    
    # Check if we have connection info for this county
    if county_key not in COUNTY_API_CONFIG:
        logger.warning(f"No API configuration for {county} county")
        return _get_fallback_assessment_data(property_id, county_key)
    
    # Get the county API configuration
    api_config = COUNTY_API_CONFIG[county_key]
    
    try:
        # Make the API call to the county assessment database
        # Different counties may have different parameter requirements
        if county_key == 'walla_walla':
            api_response = requests.get(
                api_config['base_url'],
                params={
                    'where': f"PARCEL_ID='{property_id}'",
                    'outFields': '*',
                    'f': api_config['format'],
                    'token': api_config['api_key']
                },
                timeout=10
            )
        elif county_key == 'benton':
            api_response = requests.get(
                f"{api_config['base_url']}/{property_id}",
                headers={
                    'x-api-key': api_config['api_key']
                },
                timeout=10
            )
        elif county_key == 'franklin':
            api_response = requests.get(
                api_config['base_url'],
                params={
                    'parcel_number': property_id,
                    'api_key': api_config['api_key']
                },
                timeout=10
            )
        else:
            # Generic API call for other counties
            api_response = requests.get(
                api_config['base_url'],
                params={
                    'parcel_id': property_id,
                    'format': api_config['format'],
                    'api_key': api_config['api_key']
                },
                timeout=10
            )
        
        # Check if the response was successful
        if api_response.status_code == 200:
            # Process the API response into our standard format
            raw_data = api_response.json()
            return _process_county_api_response(raw_data, county_key)
        else:
            logger.error(f"API call failed with status {api_response.status_code}: {api_response.text}")
            # Fall back to sample data when API call fails
            return _get_fallback_assessment_data(property_id, county_key)
            
    except requests.RequestException as e:
        logger.error(f"Error fetching assessment data: {str(e)}")
        return _get_fallback_assessment_data(property_id, county_key)
    except Exception as e:
        logger.error(f"Unexpected error processing assessment data: {str(e)}")
        return _get_fallback_assessment_data(property_id, county_key)

def _get_zillow_property_data(property_id: str) -> Dict[str, Any]:
    """
    Attempt to get property data from Zillow API using our property ID mapping.
    
    Args:
        property_id: Internal property ID
        
    Returns:
        Property data in our standard format or empty dict if not available
    """
    if property_id not in PROPERTY_ZPID_MAP:
        logger.info(f"No Zillow property ID mapping for {property_id}")
        return {}
    
    zpid = PROPERTY_ZPID_MAP[property_id]
    logger.info(f"Fetching Zillow data for property {property_id} (Zillow ID: {zpid})")
    
    try:
        # Initialize the Zillow scraper with RapidAPI key
        rapid_api_key = os.environ.get("RAPIDAPI_KEY")
        if not rapid_api_key:
            logger.warning("No RapidAPI key available for Zillow API")
            return {}
            
        zillow_scraper = ZillowScraper(api_key=rapid_api_key)
        
        # Fetch property details from Zillow
        property_details = zillow_scraper.get_property_details(zpid)
        
        if not property_details:
            logger.warning(f"No property details returned from Zillow for ZPID {zpid}")
            return {}
            
        # Convert the Zillow data to our standard format
        return _format_zillow_data(property_details, property_id)
        
    except Exception as e:
        logger.error(f"Error getting Zillow property data: {str(e)}")
        logger.error(traceback.format_exc())
        return {}

def _get_fallback_assessment_data(property_id: str, county_key: str) -> Dict[str, Any]:
    """
    Get demo assessment data when real API connection is not available.
    
    This function returns demonstration data for development and testing purposes.
    In production, this would be replaced with real data from county APIs.
    
    IMPORTANT: The data returned by this function is for UI demonstration only
    and does not represent actual property assessment data.
    """
    logger.info(f"Using demonstration assessment data for {property_id} in {county_key}")

    current_year = datetime.now().year
    
    # For Walla Walla County
    if county_key == 'walla_walla' and property_id == 'ww42':
        return {
            "using_demo_data": True,
            "PropertyRecord": {
                "ParcelID": property_id,
                "ParcelNumber": "12-34-5678-9012",
                "SitusAddress": "4234 OLD MILTON HWY",
                "OwnerName": "JOHNSON FAMILY TRUST",
                "LegalDescription": "LOT 7 BLK 3 BLUEWOOD ESTATES SEC 14 TWP 7N RGE 35 EWM",
                "PropertyClass": "Single Family Residential",
                "TaxArea": "WWSF-012",
                "LandValue": 236700,
                "ImprovementValue": 552300,
                "MarketValue": 789000,
                "AssessedValue": 789000,
                "ExemptionValue": 0,
                "LevyCode": "1234",
                "TaxStatus": "Taxable",
                "Acres": 1.2,
                "LastSaleDate": "2019-07-10",
                "LastSalePrice": 678000,
                "AssessmentYear": current_year,
                "TaxYear": current_year,
                "NeighborhoodCode": "3450",
                "SchoolDistrict": "Walla Walla School District",
                "FireDistrict": "Walla Walla County Fire District 4",
                "Zoning": "R-1 (Single Family Residential)"
            },
            "BuildingData": {
                "YearBuilt": 1992,
                "EffectiveYear": 1995,
                "SquareFeet": 2428,
                "Quality": "Good",
                "Condition": "Good",
                "Bedrooms": 4,
                "Bathrooms": 3.5,
                "Foundation": "Concrete",
                "ExteriorWalls": "Wood Frame/Siding",
                "RoofType": "Comp Shingle",
                "HeatingCooling": "Central Heat/AC",
                "Fireplaces": 1,
                "BasementSF": 0,
                "GarageType": "Attached",
                "GarageSF": 576,
                "Stories": 1
            },
            "LandData": {
                "LandType": "Residential",
                "Topography": "Level",
                "Utilities": "All Public",
                "ViewQuality": "Good - Mountain View"
            },
            "AssessmentHistory": [
                {
                    "Year": current_year,
                    "LandValue": 236700,
                    "ImprovementValue": 552300,
                    "TotalValue": 789000,
                    "Change": 6.8
                },
                {
                    "Year": current_year - 1,
                    "LandValue": 221700,
                    "ImprovementValue": 517300,
                    "TotalValue": 739000,
                    "Change": 4.2
                },
                {
                    "Year": current_year - 2,
                    "LandValue": 212700,
                    "ImprovementValue": 496300,
                    "TotalValue": 709000,
                    "Change": 3.5
                }
            ]
        }
    # For Benton County
    elif county_key == 'benton' and property_id == 'bt75':
        return {
            "using_demo_data": True,
            "PropertyRecord": {
                "ParcelID": property_id,
                "ParcelNumber": "1-0875-400-0012-000",
                "SitusAddress": "3821 WILLIAMS BLVD",
                "OwnerName": "SMITH LIVING TRUST",
                "LegalDescription": "LOT 12 BLOCK 4 MEADOW SPRINGS SECOND ADDITION",
                "PropertyClass": "Single Family Residential",
                "TaxArea": "0100",
                "LandValue": 187500,
                "ImprovementValue": 437500,
                "MarketValue": 625000,
                "AssessedValue": 625000,
                "ExemptionValue": 0,
                "LevyCode": "01-001",
                "TaxStatus": "Taxable",
                "Acres": 0.32,
                "LastSaleDate": "2018-06-15",
                "LastSalePrice": 532000,
                "AssessmentYear": current_year,
                "TaxYear": current_year,
                "NeighborhoodCode": "1050",
                "SchoolDistrict": "Richland School District",
                "FireDistrict": "Richland Fire Department",
                "Zoning": "R-1-10 (Single Family Residential)"
            },
            "BuildingData": {
                "YearBuilt": 1988,
                "EffectiveYear": 1995,
                "SquareFeet": 2273,
                "Quality": "Good",
                "Condition": "Average",
                "Bedrooms": 4,
                "Bathrooms": 2.5,
                "Foundation": "Concrete",
                "ExteriorWalls": "Brick Veneer",
                "RoofType": "Comp Shingle",
                "HeatingCooling": "Heat Pump",
                "Fireplaces": 1,
                "BasementSF": 0,
                "GarageType": "Attached",
                "GarageSF": 484,
                "Stories": 1
            },
            "LandData": {
                "LandType": "Residential",
                "Topography": "Level",
                "Utilities": "All Public",
                "ViewQuality": "Average"
            },
            "AssessmentHistory": [
                {
                    "Year": current_year,
                    "LandValue": 187500,
                    "ImprovementValue": 437500,
                    "TotalValue": 625000,
                    "Change": 5.9
                },
                {
                    "Year": current_year - 1,
                    "LandValue": 177000,
                    "ImprovementValue": 413000,
                    "TotalValue": 590000,
                    "Change": 4.4
                },
                {
                    "Year": current_year - 2,
                    "LandValue": 169500,
                    "ImprovementValue": 395500,
                    "TotalValue": 565000,
                    "Change": 3.7
                }
            ]
        }
    
    # Return empty data if no county-specific data available
    logger.warning(f"No assessment data available for property {property_id} in {county_key} county")
    return {}

def _format_zillow_data(property_data: Dict[str, Any], property_id: str) -> Dict[str, Any]:
    """
    Format Zillow property data into our standard assessment data format.
    
    Args:
        property_data: Raw data from Zillow API
        property_id: Internal property ID
    
    Returns:
        Formatted property data in our standard format
    """
    logger.info(f"Formatting Zillow data for property {property_id}")
    
    # Extract basic property info
    address = property_data.get('address', {})
    price = property_data.get('price', 0)
    
    # Extract zestimate (estimated value) info
    zestimate_data = property_data.get('zestimate', {})
    zestimate = zestimate_data.get('value', 0) if zestimate_data else price
    
    # Calculate land and improvement values (30% land, 70% improvements is typical)
    land_value = int(zestimate * 0.3) if zestimate else 0
    improvement_value = int(zestimate * 0.7) if zestimate else 0
    
    # Extract home facts
    home_facts = property_data.get('resoFacts', {})
    bedrooms = home_facts.get('bedrooms', 0)
    bathrooms = home_facts.get('bathrooms', 0)
    sqft = home_facts.get('livingArea', 0)
    lot_size = home_facts.get('lotSize', 0)
    year_built = home_facts.get('yearBuilt', 0)
    stories = home_facts.get('stories', 0)
    property_type = property_data.get('homeType', '')
    
    # Extract tax history if available
    tax_history = property_data.get('taxHistory', [])
    assessment_history = []
    
    # Current year for tax/assessment year
    current_year = datetime.now().year
    
    # Process tax history into assessment history format
    for tax_entry in tax_history:
        year = tax_entry.get('year', 0)
        tax_amount = tax_entry.get('taxPaid', 0)
        value = tax_entry.get('value', 0)
        
        # Skip entries without a year
        if not year:
            continue
            
        # Calculate a change percentage (placeholder)
        change = 0
        if len(assessment_history) > 0:
            prev_value = assessment_history[-1].get('TotalValue', 0)
            if prev_value > 0:
                change = round((value - prev_value) / prev_value * 100, 1)
        
        assessment_history.append({
            "Year": year,
            "LandValue": int(value * 0.3) if value else 0,
            "ImprovementValue": int(value * 0.7) if value else 0,
            "TotalValue": value,
            "Change": change
        })
    
    # Sort assessment history by year (newest first)
    assessment_history.sort(key=lambda x: x['Year'], reverse=True)
    
    # If we have price history, extract the last sale information
    price_history = property_data.get('priceHistory', [])
    last_sale_date = ''
    last_sale_price = 0
    
    if price_history:
        # Sort by date (newest first)
        sorted_history = sorted(price_history, 
                               key=lambda x: datetime.strptime(x.get('date', '2000-01-01'), '%Y-%m-%d'),
                               reverse=True)
                               
        # Find the most recent sale (not just listing)
        for entry in sorted_history:
            if entry.get('event', '').lower() == 'sold':
                last_sale_date = entry.get('date', '')
                last_sale_price = entry.get('price', 0)
                break
    
    # Get full address
    full_address = f"{address.get('streetAddress', '')}"
    city = address.get('city', '')
    state = address.get('state', '')
    zipcode = address.get('zipcode', '')
    
    # Create standardized assessment data
    return {
        "using_real_data": True,
        "data_source": "Zillow API",
        "PropertyRecord": {
            "ParcelID": property_id,
            "ParcelNumber": property_data.get('zpid', ''),
            "SitusAddress": full_address,
            "City": city,
            "State": state,
            "ZipCode": zipcode,
            "OwnerName": "Current Owner",  # Zillow doesn't provide owner name
            "LegalDescription": home_facts.get('legalDescription', ''),
            "PropertyClass": property_type,
            "TaxArea": f"{city} {zipcode}",
            "LandValue": land_value,
            "ImprovementValue": improvement_value,
            "MarketValue": zestimate,
            "AssessedValue": zestimate,
            "ExemptionValue": 0,
            "LevyCode": "",
            "TaxStatus": "Taxable",
            "Acres": lot_size,
            "LastSaleDate": last_sale_date,
            "LastSalePrice": last_sale_price,
            "AssessmentYear": current_year,
            "TaxYear": current_year
        },
        "BuildingData": {
            "YearBuilt": year_built,
            "EffectiveYear": year_built,
            "SquareFeet": sqft,
            "Quality": "Average",
            "Condition": "Average",
            "Bedrooms": bedrooms,
            "Bathrooms": bathrooms,
            "Foundation": home_facts.get('foundation', 'Concrete'),
            "ExteriorWalls": home_facts.get('exterior', 'Wood Frame'),
            "RoofType": home_facts.get('roof', 'Composite'),
            "HeatingCooling": home_facts.get('heating', 'Central'),
            "Fireplaces": home_facts.get('fireplaces', 0),
            "BasementSF": home_facts.get('basement', 0),
            "GarageType": "Attached" if home_facts.get('hasAttachedGarage', False) else "Detached",
            "GarageSF": home_facts.get('garageArea', 0),
            "Stories": stories
        },
        "LandData": {
            "LandType": "Residential",
            "Topography": "Level",
            "Utilities": "All Public",
            "ViewQuality": property_data.get('hasView', False) and "Good" or "Average"
        },
        "AssessmentHistory": assessment_history
    }

def _process_county_api_response(raw_data: Dict[str, Any], county_key: str) -> Dict[str, Any]:
    """
    Process county API response into a standardized format.
    Different counties return data in different formats, so we need to convert them.
    
    Args:
        raw_data: Raw data from county API
        county_key: County identifier
        
    Returns:
        Standardized assessment data
    """
    # Get the current year for assessment history
    current_year = datetime.now().year
    
    # Initialize the standard structure
    result = {
        "PropertyRecord": {},
        "BuildingData": {},
        "LandData": {},
        "AssessmentHistory": []
    }
    
    try:
        # Process based on county format
        if county_key == 'walla_walla':
            # Walla Walla returns GIS-based data in a features array
            if 'features' in raw_data and raw_data['features']:
                feature = raw_data['features'][0]
                attributes = feature.get('attributes', {})
                
                # Map Walla Walla attributes to our standard format
                result["PropertyRecord"] = {
                    "ParcelID": attributes.get('PARCEL_ID', ''),
                    "ParcelNumber": attributes.get('PARCEL_NUMBER', ''),
                    "SitusAddress": attributes.get('SITUS_ADDRESS', ''),
                    "OwnerName": attributes.get('OWNER_NAME', ''),
                    "LegalDescription": attributes.get('LEGAL_DESC', ''),
                    "PropertyClass": attributes.get('PROPERTY_CLASS', ''),
                    "TaxArea": attributes.get('TAX_AREA', ''),
                    "LandValue": attributes.get('LAND_VALUE', 0),
                    "ImprovementValue": attributes.get('IMPROVEMENT_VALUE', 0),
                    "MarketValue": attributes.get('MARKET_VALUE', 0),
                    "AssessedValue": attributes.get('ASSESSED_VALUE', 0),
                    "ExemptionValue": attributes.get('EXEMPTION_VALUE', 0),
                    "LevyCode": attributes.get('LEVY_CODE', ''),
                    "TaxStatus": attributes.get('TAX_STATUS', ''),
                    "Acres": attributes.get('ACRES', 0),
                    "LastSaleDate": attributes.get('LAST_SALE_DATE', ''),
                    "LastSalePrice": attributes.get('LAST_SALE_PRICE', 0),
                    "AssessmentYear": attributes.get('ASSESSMENT_YEAR', current_year),
                    "TaxYear": attributes.get('TAX_YEAR', current_year),
                    "NeighborhoodCode": attributes.get('NEIGHBORHOOD_CODE', ''),
                    "SchoolDistrict": attributes.get('SCHOOL_DISTRICT', ''),
                    "FireDistrict": attributes.get('FIRE_DISTRICT', ''),
                    "Zoning": attributes.get('ZONING', '')
                }
                
                result["BuildingData"] = {
                    "YearBuilt": attributes.get('YEAR_BUILT', 0),
                    "EffectiveYear": attributes.get('EFFECTIVE_YEAR', 0),
                    "SquareFeet": attributes.get('SQUARE_FEET', 0),
                    "Quality": attributes.get('QUALITY', ''),
                    "Condition": attributes.get('CONDITION', ''),
                    "Bedrooms": attributes.get('BEDROOMS', 0),
                    "Bathrooms": attributes.get('BATHROOMS', 0),
                    "Foundation": attributes.get('FOUNDATION', ''),
                    "ExteriorWalls": attributes.get('EXTERIOR_WALLS', ''),
                    "RoofType": attributes.get('ROOF_TYPE', ''),
                    "HeatingCooling": attributes.get('HEATING_COOLING', ''),
                    "Fireplaces": attributes.get('FIREPLACES', 0),
                    "BasementSF": attributes.get('BASEMENT_SF', 0),
                    "GarageType": attributes.get('GARAGE_TYPE', ''),
                    "GarageSF": attributes.get('GARAGE_SF', 0),
                    "Stories": attributes.get('STORIES', 0)
                }
                
                result["LandData"] = {
                    "LandType": attributes.get('LAND_TYPE', ''),
                    "Topography": attributes.get('TOPOGRAPHY', ''),
                    "Utilities": attributes.get('UTILITIES', ''),
                    "ViewQuality": attributes.get('VIEW_QUALITY', '')
                }
                
                # If we have assessment history data
                if 'assessmentHistory' in raw_data:
                    for history in raw_data['assessmentHistory']:
                        result["AssessmentHistory"].append({
                            "Year": history.get('YEAR', 0),
                            "LandValue": history.get('LAND_VALUE', 0),
                            "ImprovementValue": history.get('IMPROVEMENT_VALUE', 0),
                            "TotalValue": history.get('TOTAL_VALUE', 0),
                            "Change": history.get('CHANGE_PERCENT', 0)
                        })
                
        elif county_key == 'benton':
            # Benton County returns a more direct property object
            property_data = raw_data.get('property', {})
            
            # Map Benton County format to our standard structure
            result["PropertyRecord"] = {
                "ParcelID": property_data.get('parcelId', ''),
                "ParcelNumber": property_data.get('parcelNumber', ''),
                "SitusAddress": property_data.get('situs', ''),
                "OwnerName": property_data.get('owner', ''),
                "LegalDescription": property_data.get('legalDescription', ''),
                "PropertyClass": property_data.get('propertyClass', ''),
                "TaxArea": property_data.get('taxArea', ''),
                "LandValue": property_data.get('landValue', 0),
                "ImprovementValue": property_data.get('improvementValue', 0),
                "MarketValue": property_data.get('marketValue', 0),
                "AssessedValue": property_data.get('assessedValue', 0),
                "ExemptionValue": property_data.get('exemptionValue', 0),
                "LevyCode": property_data.get('levyCode', ''),
                "TaxStatus": property_data.get('taxStatus', ''),
                "Acres": property_data.get('acres', 0),
                "LastSaleDate": property_data.get('lastSaleDate', ''),
                "LastSalePrice": property_data.get('lastSalePrice', 0),
                "AssessmentYear": property_data.get('assessmentYear', current_year),
                "TaxYear": property_data.get('taxYear', current_year),
                "NeighborhoodCode": property_data.get('neighborhoodCode', ''),
                "SchoolDistrict": property_data.get('schoolDistrict', ''),
                "FireDistrict": property_data.get('fireDistrict', ''),
                "Zoning": property_data.get('zoning', '')
            }
            
            # Building data from improvements section
            improvements = property_data.get('improvements', {})
            if improvements:
                result["BuildingData"] = {
                    "YearBuilt": improvements.get('yearBuilt', 0),
                    "EffectiveYear": improvements.get('effectiveYear', 0),
                    "SquareFeet": improvements.get('squareFeet', 0),
                    "Quality": improvements.get('quality', ''),
                    "Condition": improvements.get('condition', ''),
                    "Bedrooms": improvements.get('bedrooms', 0),
                    "Bathrooms": improvements.get('bathrooms', 0),
                    "Foundation": improvements.get('foundation', ''),
                    "ExteriorWalls": improvements.get('exteriorWalls', ''),
                    "RoofType": improvements.get('roofType', ''),
                    "HeatingCooling": improvements.get('heatingCooling', ''),
                    "Fireplaces": improvements.get('fireplaces', 0),
                    "BasementSF": improvements.get('basementSF', 0),
                    "GarageType": improvements.get('garageType', ''),
                    "GarageSF": improvements.get('garageSF', 0),
                    "Stories": improvements.get('stories', 0)
                }
            
            # Land data
            land = property_data.get('land', {})
            if land:
                result["LandData"] = {
                    "LandType": land.get('landType', ''),
                    "Topography": land.get('topography', ''),
                    "Utilities": land.get('utilities', ''),
                    "ViewQuality": land.get('viewQuality', '')
                }
            
            # Assessment history
            if 'assessmentHistory' in property_data:
                for history in property_data['assessmentHistory']:
                    result["AssessmentHistory"].append({
                        "Year": history.get('year', 0),
                        "LandValue": history.get('landValue', 0),
                        "ImprovementValue": history.get('improvementValue', 0),
                        "TotalValue": history.get('totalValue', 0),
                        "Change": history.get('changePercent', 0)
                    })
                    
        elif county_key == 'franklin':
            # Process Franklin County's response format
            assessment = raw_data.get('assessment', {})
            
            # Map Franklin County data to our standard format
            result["PropertyRecord"] = {
                "ParcelID": assessment.get('parcel_id', ''),
                "ParcelNumber": assessment.get('parcel_number', ''),
                "SitusAddress": assessment.get('property_address', ''),
                "OwnerName": assessment.get('owner_name', ''),
                "LegalDescription": assessment.get('legal_description', ''),
                "PropertyClass": assessment.get('property_type', ''),
                "TaxArea": assessment.get('tax_code_area', ''),
                "LandValue": assessment.get('land_value', 0),
                "ImprovementValue": assessment.get('improvement_value', 0),
                "MarketValue": assessment.get('market_value', 0),
                "AssessedValue": assessment.get('assessed_value', 0),
                "ExemptionValue": assessment.get('exemption_amount', 0),
                "LevyCode": assessment.get('levy_code', ''),
                "TaxStatus": assessment.get('tax_status', ''),
                "Acres": assessment.get('acres', 0),
                "LastSaleDate": assessment.get('sale_date', ''),
                "LastSalePrice": assessment.get('sale_price', 0),
                "AssessmentYear": assessment.get('assessment_year', current_year),
                "TaxYear": assessment.get('tax_year', current_year),
                "NeighborhoodCode": assessment.get('neighborhood_code', ''),
                "SchoolDistrict": assessment.get('school_district', ''),
                "FireDistrict": assessment.get('fire_district', ''),
                "Zoning": assessment.get('zoning', '')
            }
            
            # Building information
            building = assessment.get('building', {})
            if building:
                result["BuildingData"] = {
                    "YearBuilt": building.get('year_built', 0),
                    "EffectiveYear": building.get('effective_year', 0),
                    "SquareFeet": building.get('square_feet', 0),
                    "Quality": building.get('quality_grade', ''),
                    "Condition": building.get('condition', ''),
                    "Bedrooms": building.get('bedrooms', 0),
                    "Bathrooms": building.get('bathrooms', 0),
                    "Foundation": building.get('foundation', ''),
                    "ExteriorWalls": building.get('exterior_walls', ''),
                    "RoofType": building.get('roof_type', ''),
                    "HeatingCooling": building.get('heating_type', ''),
                    "Fireplaces": building.get('fireplaces', 0),
                    "BasementSF": building.get('basement_area', 0),
                    "GarageType": building.get('garage_type', ''),
                    "GarageSF": building.get('garage_area', 0),
                    "Stories": building.get('stories', 0)
                }
            
            # Land information
            land = assessment.get('land', {})
            if land:
                result["LandData"] = {
                    "LandType": land.get('land_type', ''),
                    "Topography": land.get('topography', ''),
                    "Utilities": land.get('utilities', ''),
                    "ViewQuality": land.get('view', '')
                }
            
            # Assessment history
            history_data = assessment.get('history', [])
            if history_data:
                for h in history_data:
                    # Calculate change percentage
                    prev_total = h.get('previous_total', 0)
                    current_total = h.get('total_value', 0)
                    change_pct = 0
                    if prev_total and prev_total > 0:
                        change_pct = ((current_total - prev_total) / prev_total) * 100
                        
                    result["AssessmentHistory"].append({
                        "Year": h.get('year', 0),
                        "LandValue": h.get('land_value', 0),
                        "ImprovementValue": h.get('improvement_value', 0),
                        "TotalValue": h.get('total_value', 0),
                        "Change": round(change_pct, 1)
                    })
        
        else:
            # Generic processor for other counties if their format is known
            # This would need to be customized for each county's specific API format
            logger.warning(f"No specific processor for {county_key} county")
            
        # Return the processed data
        return result
        
    except Exception as e:
        logger.error(f"Error processing API response for {county_key} county: {str(e)}")
        # Return empty structure if processing fails
        return {
            "PropertyRecord": {},
            "BuildingData": {},
            "LandData": {},
            "AssessmentHistory": []
        }