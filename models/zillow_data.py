"""
Database models for Zillow market data.
"""
from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON

class ZillowMarketData(db.Model):
    """Stores market data from Zillow for specific locations."""
    
    __tablename__ = 'zillow_market_data'
    
    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.String(64), nullable=False, index=True)
    location_name = db.Column(db.String(255))
    location_type = db.Column(db.String(64))
    
    # Filter parameters
    beds = db.Column(db.Integer)
    property_types = db.Column(db.String(64))
    
    # Market statistics
    median_price = db.Column(db.Float)
    median_price_per_sqft = db.Column(db.Float)
    median_days_on_market = db.Column(db.Integer)
    avg_days_on_market = db.Column(db.Float)
    homes_sold_last_month = db.Column(db.Integer)
    total_active_listings = db.Column(db.Integer)
    
    # Store raw data for future reference
    raw_data = db.Column(JSON)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<ZillowMarketData {self.location_name} ({self.resource_id})>"
    
    def to_dict(self):
        """Convert model to dictionary for API responses."""
        return {
            "id": self.id,
            "resource_id": self.resource_id,
            "location_name": self.location_name,
            "location_type": self.location_type,
            "beds": self.beds,
            "property_types": self.property_types,
            "median_price": self.median_price,
            "median_price_per_sqft": self.median_price_per_sqft,
            "median_days_on_market": self.median_days_on_market,
            "avg_days_on_market": self.avg_days_on_market,
            "homes_sold_last_month": self.homes_sold_last_month,
            "total_active_listings": self.total_active_listings,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class ZillowPriceTrend(db.Model):
    """Stores historical price trends for markets from Zillow."""
    
    __tablename__ = 'zillow_price_trends'
    
    id = db.Column(db.Integer, primary_key=True)
    market_data_id = db.Column(db.Integer, db.ForeignKey('zillow_market_data.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    price = db.Column(db.Float)
    percent_change = db.Column(db.Float)
    
    # Relationship
    market_data = db.relationship('ZillowMarketData', backref=db.backref('price_trends', lazy=True))
    
    def __repr__(self):
        return f"<ZillowPriceTrend {self.date} ${self.price}>"
    
    def to_dict(self):
        """Convert model to dictionary for API responses."""
        return {
            "id": self.id,
            "market_data_id": self.market_data_id,
            "date": self.date.isoformat() if self.date else None,
            "price": self.price,
            "percent_change": self.percent_change
        }

class ZillowProperty(db.Model):
    """Stores property data from Zillow."""
    
    __tablename__ = 'zillow_properties'
    
    id = db.Column(db.Integer, primary_key=True)
    zpid = db.Column(db.String(64), unique=True, nullable=False, index=True)
    address = db.Column(db.String(255))
    city = db.Column(db.String(128))
    state = db.Column(db.String(64))
    zip_code = db.Column(db.String(16))
    price = db.Column(db.Float)
    beds = db.Column(db.Float)
    baths = db.Column(db.Float)
    square_feet = db.Column(db.Float)
    lot_size = db.Column(db.Float)
    year_built = db.Column(db.Integer)
    property_type = db.Column(db.String(64))
    status = db.Column(db.String(64))
    days_on_market = db.Column(db.Integer)
    
    # URLs and images
    url = db.Column(db.String(512))
    image_url = db.Column(db.String(512))
    
    # Store raw data for future reference
    raw_data = db.Column(JSON)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<ZillowProperty {self.address} ({self.zpid})>"
    
    def to_dict(self):
        """Convert model to dictionary for API responses."""
        return {
            "id": self.id,
            "zpid": self.zpid,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "price": self.price,
            "beds": self.beds,
            "baths": self.baths,
            "square_feet": self.square_feet,
            "lot_size": self.lot_size,
            "year_built": self.year_built,
            "property_type": self.property_type,
            "status": self.status,
            "days_on_market": self.days_on_market,
            "url": self.url,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }