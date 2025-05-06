"""
Property Record Controller

This controller handles requests for property records and ensures we're only displaying
authentic assessment data in compliance with IAAO and USPAP standards.
"""

import os
import logging
from typing import Dict, Any

from flask import Blueprint, render_template, request, redirect, url_for, jsonify, current_app
from regional.assessment_api import get_assessment_data

# Configure logging
logger = logging.getLogger(__name__)

# Create the blueprint
property_record_bp = Blueprint('property_record', __name__, url_prefix='/property')

@property_record_bp.route('/record/<property_id>')
def view_property_record(property_id: str):
    """
    Display a property record using only authentic assessment data.
    
    This route ensures we're complying with IAAO and USPAP standards by:
    1. Only displaying authentic assessment data from official sources
    2. Never displaying demonstration or synthetic data
    3. Clearly communicating any data retrieval errors
    
    Args:
        property_id: The ID of the property to display
        
    Returns:
        Rendered property record template or error template
    """
    # Get county parameter (default to 'benton')
    county = request.args.get('county', 'benton')
    
    logger.info(f"Requesting property record for {property_id} in {county} county")
    
    # Get assessment data from authentic source
    assessment_data = get_assessment_data(property_id, county)
    
    # Check for errors in the assessment data
    if assessment_data.get('error'):
        logger.error(f"Error retrieving property data: {assessment_data.get('error')}")
        # Render the error template with the error details
        return render_template('property_record_error.html', error=assessment_data)
    
    # If we have valid assessment data, render the property record template
    return render_template('property_record_card.html', 
                           property_id=property_id,
                           county=county,
                           assessment_data=assessment_data,
                           using_real_data=True)

@property_record_bp.route('/search', methods=['GET', 'POST'])
def property_search():
    """
    Search for property records by various criteria.
    
    This route allows users to search for properties and directs them to 
    the property record view for the selected property.
    """
    if request.method == 'POST':
        # Get search parameters from form
        property_id = request.form.get('property_id')
        county = request.form.get('county', 'benton')
        
        if property_id:
            return redirect(url_for('property_record.view_property_record', 
                                   property_id=property_id,
                                   county=county))
    
    # For GET requests, just display the search form
    return render_template('property_search.html')

def register_blueprints(app):
    """
    Register the property record blueprint with the Flask app.
    
    Args:
        app: Flask application instance
    """
    app.register_blueprint(property_record_bp)
    logger.info("Registered Property Record Card blueprint")