"""
Controller for Comparative Market Analysis (CMA) features.

This module provides routes for generating and viewing CMA reports.
"""

import logging
import json
from flask import Blueprint, render_template, request, redirect, url_for, flash, abort, jsonify, g, current_app
from werkzeug.exceptions import BadRequest

from services.cma_service import CMAService

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
cma_bp = Blueprint('cma', __name__, url_prefix='/cma')

# Create CMA service
cma_service = CMAService()

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
            return redirect(url_for('cma.view_report', report_id=report_id))
            
        except Exception as e:
            logger.exception(f"Error generating CMA report: {str(e)}")
            flash(f"Error generating CMA report: {str(e)}", 'error')
            return render_template('cma_generator.html', form_data=request.form)
    
    # GET request, show form
    return render_template('cma_generator.html')

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
        return redirect(url_for('cma.list_reports'))
        
    except Exception as e:
        logger.exception(f"Error viewing CMA report: {str(e)}")
        flash(f"Error viewing CMA report: {str(e)}", 'error')
        return redirect(url_for('cma.list_reports'))

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
        return redirect(url_for('cma.list_reports'))
        
    except Exception as e:
        logger.exception(f"Error deleting CMA report: {str(e)}")
        flash(f"Error deleting CMA report: {str(e)}", 'error')
        return redirect(url_for('cma.list_reports'))

# Function to register blueprint with Flask app
def register_cma_blueprint(app):
    """Register the CMA blueprint with the Flask app."""
    app.register_blueprint(cma_bp)
    logger.info("Registered CMA controller blueprint")