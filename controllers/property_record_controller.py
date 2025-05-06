"""
Property Record Card Controller

This controller handles routes related to property record cards
which display assessment data for properties from official county sources.
"""

import logging
from datetime import datetime
from flask import Blueprint, render_template, request, abort, url_for, redirect, flash

from regional.southeastern_wa import get_county_info
from regional.assessment_api import get_assessment_data
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
        # Get the property data from the property service
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
        
        # Fetch assessment data from county API
        assessment_data = get_assessment_data(property_id, county_name)
        logger.info(f"Retrieved assessment data for property {property_id} in {county_name}")
        
        # Check if we're using demo data or real API data
        # We can determine this by checking if the response came from a real API or the fallback function
        using_demo_data = 'using_demo_data' in assessment_data and assessment_data['using_demo_data'] == True

        # Create a merged data object that prioritizes assessment data but includes property data as fallback
        merged_data = property_data.copy()
        
        # Extract data from the structured assessment response
        property_record = assessment_data.get('PropertyRecord', {})
        building_data = assessment_data.get('BuildingData', {})
        land_data = assessment_data.get('LandData', {})
        assessment_history = assessment_data.get('AssessmentHistory', [])
        
        # Add property record data
        for key, value in property_record.items():
            # Convert camelCase to snake_case for template
            snake_key = ''.join(['_' + c.lower() if c.isupper() else c for c in key]).lstrip('_')
            merged_data[snake_key] = value
            
        # Add building data
        for key, value in building_data.items():
            snake_key = ''.join(['_' + c.lower() if c.isupper() else c for c in key]).lstrip('_')
            merged_data[snake_key] = value
        
        # Add land data
        for key, value in land_data.items():
            snake_key = ''.join(['_' + c.lower() if c.isupper() else c for c in key]).lstrip('_')
            merged_data[snake_key] = value
        
        # Get the current date
        current_date = datetime.now().strftime('%B %d, %Y')
        
        # Render the property record card template
        return render_template(
            'property_record_card.html',
            property=merged_data,
            county=county,
            current_date=current_date,
            assessment_data=assessment_data,
            assessment_history=assessment_history,
            using_demo_data=using_demo_data
        )
    except Exception as e:
        logger.exception(f"Error in property record card view: {str(e)}")
        abort(500)