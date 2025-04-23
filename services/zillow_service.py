"""
Zillow data service for retrieving, processing and storing Zillow market data.
"""
import os
import logging
from datetime import datetime, date
from typing import Dict, List, Any, Optional, Tuple

from app import db
from etl.zillow_scraper import ZillowScraper
from models.zillow_data import ZillowMarketData, ZillowPriceTrend, ZillowProperty

# Configure logger
logger = logging.getLogger(__name__)

class ZillowService:
    """Service for managing Zillow data operations."""
    
    def __init__(self, api_key=None):
        """
        Initialize the ZillowService.
        
        Args:
            api_key (str, optional): RapidAPI key. If None, will try to get from environment.
        """
        self.scraper = ZillowScraper(api_key)
    
    def get_and_store_market_data(self, resource_id: str, beds: int = 0, 
                                 property_types: str = "house") -> Tuple[ZillowMarketData, bool]:
        """
        Fetch market data from Zillow and store it in the database.
        
        Args:
            resource_id (str): The Zillow resource ID for the location (zip code, city ID)
            beds (int, optional): Number of bedrooms. Default is 0 (any).
            property_types (str, optional): Property types. Default is "house".
            
        Returns:
            Tuple[ZillowMarketData, bool]: Tuple containing the market data object and a boolean
            indicating whether the data was newly fetched (True) or retrieved from cache (False)
        """
        # Try to find existing recent data in the database
        existing_data = ZillowMarketData.query.filter_by(
            resource_id=resource_id,
            beds=beds,
            property_types=property_types
        ).order_by(ZillowMarketData.created_at.desc()).first()
        
        # If we have data from today, return it
        if existing_data and existing_data.created_at.date() == date.today():
            logger.info(f"Using cached market data for resource ID {resource_id}")
            return existing_data, False
        
        # Otherwise, fetch new data
        try:
            # Fetch from Zillow API
            raw_data = self.scraper.get_market_data(resource_id, beds, property_types)
            
            if not raw_data or "locationInfo" not in raw_data:
                logger.error(f"Failed to fetch market data for resource ID {resource_id}")
                if existing_data:
                    return existing_data, False
                return None, False
            
            # Format the data
            formatted_data = self.scraper.format_market_data(raw_data)
            
            # Create new market data record
            market_data = ZillowMarketData(
                resource_id=resource_id,
                location_name=formatted_data["location_info"].get("name"),
                location_type=formatted_data["location_info"].get("type"),
                beds=beds,
                property_types=property_types,
                median_price=formatted_data["market_overview"].get("median_price"),
                median_price_per_sqft=formatted_data["market_overview"].get("median_price_per_sqft"),
                median_days_on_market=formatted_data["market_overview"].get("median_days_on_market"),
                avg_days_on_market=formatted_data["market_overview"].get("avg_days_on_market"),
                homes_sold_last_month=formatted_data["market_overview"].get("homes_sold_last_month"),
                total_active_listings=formatted_data["market_overview"].get("total_active_listings"),
                raw_data=raw_data
            )
            
            # Save market data
            db.session.add(market_data)
            db.session.commit()
            
            # Add price trends
            for trend in formatted_data["price_trends"]:
                if not trend.get("date") or not trend.get("price"):
                    continue
                
                try:
                    # Parse date string to datetime
                    trend_date = datetime.strptime(trend["date"], "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    logger.warning(f"Invalid date format in price trend: {trend.get('date')}")
                    continue
                
                price_trend = ZillowPriceTrend(
                    market_data_id=market_data.id,
                    date=trend_date,
                    price=trend.get("price"),
                    percent_change=trend.get("percent_change")
                )
                
                db.session.add(price_trend)
            
            db.session.commit()
            logger.info(f"Successfully stored market data for resource ID {resource_id}")
            
            return market_data, True
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error fetching and storing market data: {str(e)}")
            
            # Return existing data if we have it
            if existing_data:
                return existing_data, False
                
            return None, False
    
    def get_property_details(self, zpid: str) -> Tuple[ZillowProperty, bool]:
        """
        Fetch property details from Zillow and store in the database.
        
        Args:
            zpid (str): Zillow Property ID
            
        Returns:
            Tuple[ZillowProperty, bool]: Tuple containing the property object and a boolean
            indicating whether the data was newly fetched (True) or retrieved from cache (False)
        """
        # Check if we already have this property
        existing_property = ZillowProperty.query.filter_by(zpid=zpid).first()
        
        # If we have recent data (last 7 days), return it
        if existing_property and (datetime.utcnow() - existing_property.updated_at).days < 7:
            logger.info(f"Using cached property data for ZPID {zpid}")
            return existing_property, False
        
        # Otherwise, fetch new data
        try:
            # Fetch from Zillow API
            property_data = self.scraper.get_property_details(zpid)
            
            if not property_data:
                logger.error(f"Failed to fetch property details for ZPID {zpid}")
                if existing_property:
                    return existing_property, False
                return None, False
            
            # Extract property information
            address = property_data.get("address", {})
            price_info = property_data.get("price", {})
            building_info = property_data.get("building", {})
            
            # Create or update property record
            if existing_property:
                property_obj = existing_property
            else:
                property_obj = ZillowProperty(zpid=zpid)
            
            # Update properties
            property_obj.address = address.get("streetAddress")
            property_obj.city = address.get("city")
            property_obj.state = address.get("state")
            property_obj.zip_code = address.get("zipcode")
            property_obj.price = price_info.get("value")
            property_obj.beds = building_info.get("beds")
            property_obj.baths = building_info.get("baths")
            property_obj.square_feet = building_info.get("livingArea")
            property_obj.lot_size = building_info.get("lotSize")
            property_obj.year_built = building_info.get("yearBuilt")
            property_obj.property_type = property_data.get("propertyType")
            property_obj.status = property_data.get("homeStatus")
            property_obj.days_on_market = property_data.get("daysOnZillow")
            property_obj.url = property_data.get("url")
            property_obj.image_url = property_data.get("imgSrc")
            property_obj.raw_data = property_data
            
            # Save to database
            if not existing_property:
                db.session.add(property_obj)
            
            db.session.commit()
            logger.info(f"Successfully stored property details for ZPID {zpid}")
            
            return property_obj, True
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error fetching and storing property details: {str(e)}")
            
            # Return existing data if we have it
            if existing_property:
                return existing_property, False
                
            return None, False
    
    def search_properties(self, location: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for properties in a location and return formatted results.
        
        Args:
            location (str): Location to search (city, zip code, etc.)
            limit (int, optional): Maximum number of results to return. Default is 10.
            
        Returns:
            List[Dict[str, Any]]: List of property data dictionaries
        """
        try:
            # First page of results
            search_results = self.scraper.search_properties(location, page=1)
            
            if not search_results or not search_results.get("results"):
                logger.warning(f"No properties found for location: {location}")
                return []
            
            results = search_results.get("results", [])
            formatted_results = []
            
            # Process each result
            for idx, result in enumerate(results):
                if idx >= limit:
                    break
                    
                zpid = result.get("zpid")
                if not zpid:
                    continue
                
                # Check if we have this property in our database
                property_obj = ZillowProperty.query.filter_by(zpid=zpid).first()
                
                # If not in database or outdated, fetch and store it
                if not property_obj or (datetime.utcnow() - property_obj.updated_at).days >= 7:
                    property_obj, _ = self.get_property_details(zpid)
                
                # If we successfully got the property, add to results
                if property_obj:
                    formatted_results.append(property_obj.to_dict())
            
            return formatted_results
            
        except Exception as e:
            logger.exception(f"Error searching properties: {str(e)}")
            return []