"""
Controller for Comparative Market Analysis (CMA) features.

This module provides routes for generating and viewing CMA reports.
"""

import logging
import json
from flask import Blueprint, render_template, request, redirect, url_for, flash, abort, jsonify, g, current_app
from werkzeug.exceptions import BadRequest

from services.cma_service import CMAService
from ai.rag.property_retriever import PropertyRetriever

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint with a unique name to avoid conflicts with the API blueprint
cma_bp = Blueprint('cma_ui', __name__, url_prefix='/cma')

# Create CMA service
cma_service = CMAService()

# Create property retriever
property_retriever = PropertyRetriever()

@cma_bp.route('/', methods=['GET'])
def cma_home():
    """CMA home page."""
    return render_template('cma_home.html')

@cma_bp.route('/generator', methods=['GET', 'POST'])
def cma_generator():
    """CMA generator page."""
    if request.method == 'POST':
        try:
            # Get form data
            data = {
                'subject_address': request.form.get('subject_address'),
                'subject_city': request.form.get('subject_city'),
                'subject_state': request.form.get('subject_state'),
                'subject_zip': request.form.get('subject_zip'),
                'subject_beds': int(request.form.get('subject_beds', 3)),
                'subject_baths': float(request.form.get('subject_baths', 2)),
                'subject_sqft': int(request.form.get('subject_sqft', 1800)),
                'subject_lot_size': int(request.form.get('subject_lot_size', 5000)),
                'subject_year_built': int(request.form.get('subject_year_built', 2000)),
                'subject_property_type': request.form.get('subject_property_type', 'Single Family'),
                'subject_price': int(request.form.get('subject_price', 0)) if request.form.get('subject_price') else None
            }
            
            # Validate required fields
            required_fields = ['subject_address', 'subject_city', 'subject_state', 'subject_zip']
            for field in required_fields:
                if not data.get(field):
                    flash(f"Missing required field: {field.replace('subject_', '')}", 'error')
                    return render_template('cma_generator.html', form_data=data)
            
            # Create report
            report_id = cma_service.create_report(data)
            
            # Generate report
            cma_service.generate_report(report_id)
            
            # Redirect to report page
            flash('CMA report generated successfully', 'success')
            return redirect(url_for('cma_ui.view_report', report_id=report_id))
            
        except Exception as e:
            logger.exception(f"Error generating CMA report: {str(e)}")
            flash(f"Error generating CMA report: {str(e)}", 'error')
            return render_template('cma_generator.html', form_data=request.form)
    
    # GET request, show form
    property_id = request.args.get('property_id')
    form_data = {}
    
    # If property_id provided, pre-populate form with property data
    if property_id:
        try:
            # Get property details from Zillow service
            property_data = cma_service.zillow_service.get_property_details(property_id)
            
            if property_data:
                # Map property fields to form data
                form_data = {
                    'subject_address': property_data.get('address'),
                    'subject_city': property_data.get('city'),
                    'subject_state': property_data.get('state'),
                    'subject_zip': property_data.get('zip_code'),
                    'subject_beds': property_data.get('beds', 3),
                    'subject_baths': property_data.get('baths', 2),
                    'subject_sqft': property_data.get('sqft', 1800),
                    'subject_lot_size': property_data.get('lot_size', 5000),
                    'subject_year_built': property_data.get('year_built', 2000),
                    'subject_property_type': property_data.get('property_type', 'Single Family'),
                    'subject_price': property_data.get('price')
                }
                flash('Property details loaded successfully', 'success')
            else:
                flash('Property not found', 'error')
        except Exception as e:
            logger.exception(f"Error loading property details: {str(e)}")
            flash(f"Error loading property details: {str(e)}", 'error')
    
    return render_template('cma_generator.html', form_data=form_data)

@cma_bp.route('/reports', methods=['GET'])
def list_reports():
    """List CMA reports."""
    # Get reports
    reports = cma_service.get_reports(limit=20)
    
    return render_template('cma_reports.html', reports=reports)

@cma_bp.route('/reports/<int:report_id>', methods=['GET'])
def view_report(report_id):
    """View a CMA report."""
    try:
        # Get report
        report = cma_service.get_report(report_id)
        
        # Render template
        return render_template('cma_report.html', report=report)
        
    except ValueError as e:
        flash(f"Report not found: {str(e)}", 'error')
        return redirect(url_for('cma_ui.list_reports'))
        
    except Exception as e:
        logger.exception(f"Error viewing CMA report: {str(e)}")
        flash(f"Error viewing CMA report: {str(e)}", 'error')
        return redirect(url_for('cma_ui.list_reports'))

@cma_bp.route('/api/lookup-property', methods=['GET'])
def lookup_property():
    """API endpoint to lookup a property by address."""
    try:
        # Get address from query parameters
        address = request.args.get('address', '')
        
        if not address or len(address) < 3:
            return jsonify({'error': 'Address must be at least 3 characters long'}), 400
        
        # Use the property retriever to search for properties by address
        properties = property_retriever.retrieve_by_address(address, limit=5)
        
        # If no properties found, return empty result
        if not properties:
            return jsonify({'properties': []}), 200
        
        # Format the results for the frontend
        formatted_properties = []
        for prop in properties:
            # Convert property data to the format expected by the CMA form
            formatted_property = {
                'id': prop.get('id'),
                'address': prop.get('address', ''),
                'city': prop.get('city', ''),
                'state': prop.get('state', ''),
                'zip_code': prop.get('zip_code', ''),
                'beds': prop.get('beds', 0) or prop.get('bedrooms', 0) or 3,
                'baths': prop.get('baths', 0) or prop.get('bathrooms', 0) or 2,
                'sqft': prop.get('sqft', 0) or prop.get('square_feet', 0) or 1800,
                'lot_size': prop.get('lot_size', 0) or prop.get('lot_square_feet', 0) or 5000,
                'year_built': prop.get('year_built', 0) or 2000,
                'property_type': prop.get('property_type', 'Single Family'),
                'price': prop.get('price', 0) or prop.get('estimated_value', 0)
            }
            formatted_properties.append(formatted_property)
        
        return jsonify({'properties': formatted_properties}), 200
        
    except Exception as e:
        logger.exception(f"Error looking up property: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cma_bp.route('/reports/<int:report_id>/delete', methods=['POST'])
def delete_report(report_id):
    """Delete a CMA report."""
    try:
        # Delete report
        success = cma_service.delete_report(report_id)
        
        if success:
            flash('CMA report deleted successfully', 'success')
        else:
            flash('Report not found', 'error')
        
        # Redirect to reports list
        return redirect(url_for('cma_ui.list_reports'))
        
    except Exception as e:
        logger.exception(f"Error deleting CMA report: {str(e)}")
        flash(f"Error deleting CMA report: {str(e)}", 'error')
        return redirect(url_for('cma_ui.list_reports'))

# Function to register blueprint with Flask app
def register_cma_blueprint(app):
    """Register the CMA blueprint with the Flask app."""
    try:
        # Import here to avoid circular imports
        from core import register_blueprint_once
        
        # Register blueprint only once
        if register_blueprint_once(app, cma_bp):
            logger.info("CMA controller registered successfully")
        else:
            logger.info("CMA controller was already registered")
    except Exception as e:
        # If there's an error with the blueprint registration, log it
        logger.warning(f"CMA controller blueprint registration issue: {str(e)}")