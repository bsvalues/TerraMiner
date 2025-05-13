"""
Standardized property data models.

This module defines the SQLAlchemy models for property data,
ensuring a consistent structure across different data sources.
"""

import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Union

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

from core import Base

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class Property(Base):
    """
    Core property data model that standardizes information across sources.
    
    This model serves as the primary representation of real estate properties,
    with a standardized schema that can be populated from various data sources.
    """
    __tablename__ = 'properties'
    
    # Core identifiers
    id = Column(Integer, primary_key=True)
    external_id = Column(String(100), index=True)  # Original ID from the source system
    source = Column(String(50), index=True)  # Data source name (e.g., 'zillow', 'pacmls')
    
    # Location data
    address = Column(String(255), index=True)
    city = Column(String(100), index=True)
    state = Column(String(50), index=True)
    zip_code = Column(String(20), index=True)
    county = Column(String(100), index=True)
    latitude = Column(Float, index=True)
    longitude = Column(Float, index=True)
    
    # Property characteristics
    property_type = Column(String(50), index=True)  # Single family, condo, etc.
    bedrooms = Column(Float)  # Float to accommodate partial bedrooms (e.g., studio = 0.5)
    bathrooms = Column(Float)  # Float to accommodate half baths
    square_feet = Column(Integer)
    lot_size = Column(Float)  # In acres
    year_built = Column(Integer)
    stories = Column(Float)
    
    # Market data
    list_price = Column(Integer)
    last_sold_price = Column(Integer)
    last_sold_date = Column(DateTime)
    price_per_sqft = Column(Float)
    days_on_market = Column(Integer)
    status = Column(String(50), index=True)  # For sale, for rent, sold, etc.
    
    # Features and amenities
    features = Column(JSON)  # JSON field for flexible feature storage
    
    # Timestamps and metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_checked = Column(DateTime)
    data_quality_score = Column(Float)  # Score from 0-100 of data completeness/quality
    
    # Relationships to related data
    price_history = relationship("PropertyHistory", back_populates="property")
    listings = relationship("PropertyListing", back_populates="property")
    
    # Source-specific data (preserved for reference)
    source_data = Column(JSON)  # Original data from the source
    
    def __repr__(self):
        return f"<Property(id={self.id}, address='{self.address}', source='{self.source}')>"

class PropertyHistory(Base):
    """
    Historical property data including price changes and status updates.
    """
    __tablename__ = 'property_history'
    
    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey('properties.id'), index=True)
    
    # Event data
    event_type = Column(String(50))  # price_change, status_change, sold, etc.
    event_date = Column(DateTime)
    price = Column(Integer, nullable=True)
    status = Column(String(50), nullable=True)
    source = Column(String(50))  # Which data source provided this history point
    
    # Relationship
    property = relationship("Property", back_populates="price_history")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<PropertyHistory(property_id={self.property_id}, event='{self.event_type}', date='{self.event_date}')>"

class PropertyListing(Base):
    """
    Property listing data from various sources.
    """
    __tablename__ = 'property_listings'
    
    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey('properties.id'), index=True)
    source = Column(String(50), index=True)
    external_id = Column(String(100), index=True)
    
    # Listing data
    list_price = Column(Integer)
    listing_date = Column(DateTime)
    listing_status = Column(String(50))
    description = Column(Text)
    agent_name = Column(String(100))
    agent_phone = Column(String(50))
    agent_email = Column(String(100))
    
    # Media
    images_json = Column(JSON)  # URLs to images
    virtual_tour_url = Column(String(255))
    
    # Relationship
    property = relationship("Property", back_populates="listings")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_checked = Column(DateTime)
    
    def __repr__(self):
        return f"<PropertyListing(property_id={self.property_id}, source='{self.source}', status='{self.listing_status}')>"

class DataSourceStatus(Base):
    """
    Track the status and health of each data source.
    """
    __tablename__ = 'data_source_status'
    
    id = Column(Integer, primary_key=True)
    source_name = Column(String(50), unique=True, index=True)
    is_active = Column(Boolean, default=True)
    
    # Health metrics
    last_check = Column(DateTime)
    status = Column(String(20))  # healthy, degraded, critical, unknown
    success_rate = Column(Float)  # 0.0 to 1.0
    avg_response_time = Column(Float)  # in seconds
    error_count = Column(Integer, default=0)
    
    # Rate limiting
    rate_limit_remaining = Column(Integer, nullable=True)
    rate_limit_reset = Column(DateTime, nullable=True)
    
    # Configuration
    priority = Column(String(20), default='secondary')  # primary, secondary, fallback
    credentials_configured = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<DataSourceStatus(source='{self.source_name}', status='{self.status}', priority='{self.priority}')>"

def standardize_property_data(source_name: str, source_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert source-specific property data to the standardized format.
    
    Args:
        source_name (str): Name of the data source (e.g., 'zillow', 'pacmls')
        source_data (Dict[str, Any]): Original data from the source
        
    Returns:
        Dict[str, Any]: Standardized property data
    """
    # Start with empty standardized data
    std_data = {
        'source': source_name,
        'external_id': None,
        'address': None,
        'city': None,
        'state': None,
        'zip_code': None,
        'county': None,
        'latitude': None,
        'longitude': None,
        'property_type': None,
        'bedrooms': None,
        'bathrooms': None,
        'square_feet': None,
        'lot_size': None,
        'year_built': None,
        'stories': None,
        'list_price': None,
        'last_sold_price': None,
        'last_sold_date': None,
        'price_per_sqft': None,
        'days_on_market': None,
        'status': None,
        'features': {},
        'last_checked': datetime.utcnow(),
        'data_quality_score': 0.0,
        'source_data': source_data
    }
    
    # Apply source-specific mapping to extract standardized fields
    # This is just a skeleton - actual implementation would need source-specific logic
    if source_name == 'zillow':
        # Map Zillow fields to standard fields
        if 'zpid' in source_data:
            std_data['external_id'] = str(source_data['zpid'])
        
        # Address components
        address_data = source_data.get('address', {})
        if address_data:
            std_data['address'] = address_data.get('streetAddress')
            std_data['city'] = address_data.get('city')
            std_data['state'] = address_data.get('state')
            std_data['zip_code'] = address_data.get('zipcode')
        
        # Location
        if 'latitude' in source_data and 'longitude' in source_data:
            std_data['latitude'] = source_data['latitude']
            std_data['longitude'] = source_data['longitude']
        
        # Property details
        std_data['bedrooms'] = source_data.get('bedrooms')
        std_data['bathrooms'] = source_data.get('bathrooms')
        std_data['square_feet'] = source_data.get('livingArea')
        std_data['lot_size'] = source_data.get('lotSize')
        std_data['year_built'] = source_data.get('yearBuilt')
        
        # Price information
        std_data['list_price'] = source_data.get('price')
        
        # Status
        std_data['status'] = source_data.get('homeStatus', '').lower()
        
    elif source_name == 'pacmls':
        # Map PACMLS fields to standard fields
        if 'listingId' in source_data:
            std_data['external_id'] = source_data['listingId']
        
        # Address components
        std_data['address'] = source_data.get('address')
        std_data['city'] = source_data.get('city')
        std_data['state'] = source_data.get('state')
        std_data['zip_code'] = source_data.get('zipCode')
        std_data['county'] = source_data.get('county')
        
        # Location
        if 'coordinates' in source_data:
            coords = source_data['coordinates']
            std_data['latitude'] = coords.get('latitude')
            std_data['longitude'] = coords.get('longitude')
        
        # Property details
        std_data['bedrooms'] = source_data.get('bedrooms')
        std_data['bathrooms'] = source_data.get('bathrooms')
        std_data['square_feet'] = source_data.get('squareFeet')
        std_data['lot_size'] = source_data.get('lotSize')
        std_data['year_built'] = source_data.get('yearBuilt')
        
        # Price information
        std_data['list_price'] = source_data.get('listPrice')
        std_data['last_sold_price'] = source_data.get('lastSoldPrice')
        if 'lastSoldDate' in source_data:
            try:
                std_data['last_sold_date'] = datetime.fromisoformat(source_data['lastSoldDate'])
            except (ValueError, TypeError):
                pass
        
        # Status
        std_data['status'] = source_data.get('status', '').lower()
    
    # Add other source-specific mappings as needed
    
    # Calculate data quality score based on field completeness
    # Count how many fields are populated
    populated_fields = sum(1 for value in std_data.values() if value is not None and value != {})
    # Calculate as a percentage of total fields
    std_data['data_quality_score'] = (populated_fields / len(std_data)) * 100
    
    return std_data