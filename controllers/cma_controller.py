"""
Controller for Comparative Market Analysis (CMA) functionality.

This module provides routes for the CMA web interface.
"""

import logging
from flask import Blueprint, render_template, redirect, url_for, request, flash, current_app, jsonify
from werkzeug.exceptions import BadRequest, NotFound

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
    return render_template('cma_generator.html')

@cma_bp.route('/reports', methods=['GET'])
def list_reports():
    """List CMA reports."""
    try:
        # Get query parameters
        user_id = request.args.get('user_id')
        limit = int(request.args.get('limit', 10))
        
        # Get reports
        reports = cma_service.get_reports(user_id, limit)
        
        return render_template('cma_reports.html', reports=reports)
        
    except Exception as e:
        logger.exception(f"Error listing CMA reports: {str(e)}")
        flash(f"An error occurred: {str(e)}", 'error')
        return redirect(url_for('dashboard.home'))

@cma_bp.route('/reports/<int:report_id>', methods=['GET'])
def view_report(report_id):
    """View a CMA report."""
    try:
        # Get the report
        report = cma_service.get_report(report_id)
        
        return render_template('cma_report.html', report=report)
        
    except ValueError as e:
        logger.warning(f"CMA report not found: {str(e)}")
        flash('Report not found', 'error')
        return redirect(url_for('cma.list_reports'))
        
    except Exception as e:
        logger.exception(f"Error viewing CMA report: {str(e)}")
        flash(f"An error occurred: {str(e)}", 'error')
        return redirect(url_for('cma.list_reports'))

def register_routes(app):
    """Register the CMA routes with the Flask app."""
    app.register_blueprint(cma_bp)
    logger.info("Registered CMA controller blueprint")