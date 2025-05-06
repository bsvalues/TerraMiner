"""
Property Record Card Controller

This controller handles routes related to property record cards
which display assessment data for properties.
"""

import logging
from datetime import datetime
from flask import Blueprint, render_template, request, abort, url_for, redirect, flash

from regional.southeastern_wa import (
    get_county_info,
    format_for_assessment_report
)
from services.property_service import get_property_by_id

logger = logging.getLogger(__name__)

# Create blueprint
property_record_blueprint = Blueprint('property_record', __name__, url_prefix='/property-records')

@property_record_blueprint.route('/<property_id>', methods=['GET'])
def view_property_record(property_id):
    """
    Display the property record card for a specific property
    
    Args:
        property_id: ID of the property to show the record card for
    """
    try:
        # Get the property data
        property_data = get_property_by_id(property_id)
        
        if not property_data:
            flash("Property not found. Please try a different property ID.", "warning")
            return redirect(url_for('index'))
        
        # Get the county information
        county_name = property_data.get('county') or 'benton'
        if property_data.get('city') and not property_data.get('county'):
            # Try to determine county from city
            city_lower = property_data.get('city', '').lower()
            if city_lower in ['kennewick', 'richland', 'west richland', 'prosser', 'benton city']:
                county_name = 'benton'
            elif city_lower in ['pasco', 'connell', 'mesa', 'basin city']:
                county_name = 'franklin'
            elif city_lower in ['walla walla', 'college place', 'waitsburg', 'prescott', 'burbank']:
                county_name = 'walla_walla'
            elif city_lower in ['dayton', 'starbuck']:
                county_name = 'columbia'
            elif city_lower in ['pomeroy']:
                county_name = 'garfield'
            elif city_lower in ['clarkston', 'asotin']:
                county_name = 'asotin'
        
        county = get_county_info(county_name)
        
        # Format data for assessment report
        assessment_data = format_for_assessment_report(property_data)
        
        # Merge assessment data with property data
        property_data.update(assessment_data)
        
        # Get the current date
        current_date = datetime.now().strftime('%B %d, %Y')
        
        # Render the property record card template
        return render_template(
            'property_record_card.html',
            property=property_data,
            county=county,
            current_date=current_date
        )
    except Exception as e:
        logger.exception(f"Error in property record card view: {str(e)}")
        abort(500)