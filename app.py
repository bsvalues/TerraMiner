import os
import logging
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, send_file
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from etl.narrpr_scraper import NarrprScraper
from db.database import save_to_database, Database
from utils.logger import setup_logger
from utils.config import load_config, update_config
from utils.export import export_to_csv, export_to_json, export_to_excel, get_export_formats
from utils.test_data import insert_test_data

# Initialize logger
setup_logger()
logger = logging.getLogger(__name__)

# Initialize Flask app
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize database
db.init_app(app)

# Load configuration
config = load_config()

# Routes
@app.route('/')
def index():
    """Redirect to the monitoring dashboard as the main entry point."""
    return redirect(url_for('monitoring_dashboard'))

@app.route('/dashboard')
def old_index():
    """Render the home page with recent activity and stats."""
    # Placeholder data - in a real app, this would come from the database
    recent_activity = []
    stats = {
        'total_reports': 0,
        'total_properties': 0,
        'last_run': 'Never',
        'success_rate': 0
    }
    
    # Try to get real data if database is available
    try:
        db_conn = Database()
        
        # Get recent activity - check if table exists first
        try:
            activity_query = "SELECT action, details, created_at as timestamp FROM activity_log ORDER BY created_at DESC LIMIT 5"
            recent_activity = db_conn.execute_query(activity_query)
        except Exception:
            # Table probably doesn't exist yet
            recent_activity = []
        
        # Get stats - safe query that won't fail if tables don't exist yet
        stats_query = """
        SELECT 
            COALESCE((SELECT COUNT(*) FROM narrpr_reports WHERE 1=1), 0) as total_reports,
            COALESCE((SELECT COUNT(DISTINCT address) FROM narrpr_reports WHERE address != 'Not available'), 0) as total_properties,
            (SELECT MAX(created_at) FROM narrpr_reports WHERE 1=1) as last_run,
            0 as success_rate
        """
        stats_result = db_conn.execute_query(stats_query)
        if stats_result and len(stats_result) > 0:
            stats = stats_result[0]
            # Format last_run date
            if stats['last_run']:
                stats['last_run'] = stats['last_run'].strftime("%Y-%m-%d %H:%M:%S")
        
        db_conn.close()
    except Exception as e:
        logger.error(f"Error retrieving dashboard data: {str(e)}")
    
    return render_template('index.html', recent_activity=recent_activity, stats=stats)

@app.route('/run-scraper', methods=['GET', 'POST'])
def run_scraper():
    """Run the NARRPR scraper manually."""
    if request.method == 'POST':
        try:
            # Load credentials from form or environment variables
            username = request.form.get('username') or os.getenv("NARRPR_USERNAME")
            password = request.form.get('password') or os.getenv("NARRPR_PASSWORD")
            
            if not username or not password:
                flash("Missing credentials. Please provide username and password.", "danger")
                return redirect(url_for('run_scraper'))
            
            # Initialize scraper
            narrpr_scraper = NarrprScraper(username, password)
            
            # Login to NARRPR
            login_success = narrpr_scraper.login()
            if not login_success:
                flash("Failed to login to NARRPR. Please check your credentials.", "danger")
                return redirect(url_for('run_scraper'))
            
            # Scrape reports data
            reports_data = narrpr_scraper.scrape_reports()
            if not reports_data:
                flash("No reports data found.", "warning")
                narrpr_scraper.close()
                return redirect(url_for('run_scraper'))
            
            # Generate timestamp for filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            csv_filename = f"narrpr_reports_{timestamp}.csv"
            
            # Save data to CSV file
            csv_path = narrpr_scraper.save_to_csv(reports_data, filename=csv_filename)
            
            # Save data to database
            db_result = save_to_database(reports_data, "narrpr_reports")
            
            # Close the browser
            narrpr_scraper.close()
            
            # Flash success message
            flash(f"Successfully scraped {len(reports_data)} reports. Data saved to CSV and database.", "success")
            
            # Store filename in session for display on reports page
            session['latest_csv'] = csv_filename
            
            return redirect(url_for('reports'))
            
        except Exception as e:
            flash(f"Error running scraper: {str(e)}", "danger")
            logger.exception("Error in run_scraper route")
            return redirect(url_for('run_scraper'))
    
    return render_template('run_scraper.html')

@app.route('/reports')
def reports():
    """Display scraped reports."""
    reports_data = []
    export_formats = get_export_formats()
    
    try:
        # Get reports from database
        db_conn = Database()
        try:
            reports_query = """
            SELECT * FROM narrpr_reports 
            ORDER BY created_at DESC 
            LIMIT 100
            """
            reports_data = db_conn.execute_query(reports_query)
        except Exception as e:
            logger.warning(f"Could not query reports: {str(e)}")
            reports_data = []
        db_conn.close()
    except Exception as e:
        flash(f"Error connecting to database: {str(e)}", "danger")
        logger.exception("Error in reports route")
    
    return render_template('reports.html', reports=reports_data, export_formats=export_formats)

@app.route('/export/<format>')
def export_data(format):
    """Export data in the specified format."""
    try:
        # Get reports from database
        db_conn = Database()
        try:
            # Get query parameters
            limit = request.args.get('limit', default=100, type=int)
            include_metadata = request.args.get('include_metadata', default=False, type=lambda v: v.lower() == 'true')
            include_all_columns = request.args.get('include_all_columns', default=True, type=lambda v: v.lower() == 'true')
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            
            # Add safety limit
            if limit > 1000:
                limit = 1000
                
            # Build the query with filters
            if include_all_columns:
                select_clause = "*"
            else:
                select_clause = "id, title, address, price, date, created_at"
                
            query_parts = [f"SELECT {select_clause} FROM narrpr_reports"]
            where_clauses = []
            
            # Add date filters if provided
            if start_date:
                where_clauses.append(f"date >= '{start_date}'")
            if end_date:
                where_clauses.append(f"date <= '{end_date}'")
                
            if where_clauses:
                query_parts.append("WHERE " + " AND ".join(where_clauses))
                
            # Add sorting and limit
            query_parts.append("ORDER BY created_at DESC")
            query_parts.append(f"LIMIT {limit}")
            
            # Create the final query
            reports_query = " ".join(query_parts)
            reports_data = db_conn.execute_query(reports_query)
            
            if not reports_data:
                flash("No data available to export.", "warning")
                return redirect(url_for('reports'))
                
            # Generate timestamp for filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"narrpr_export_{timestamp}"
            
            # Add metadata if requested
            if include_metadata:
                # Add export metadata to the data
                export_metadata = {
                    "export_timestamp": datetime.now().isoformat(),
                    "export_user": "system",  # Replace with actual user if authentication is added
                    "record_count": len(reports_data),
                    "query_limit": limit,
                    "export_format": format
                }
                
                # Add metadata as the first record for CSV and Excel formats
                # For JSON, we'll include it in a separate metadata section
                if format in ['csv', 'excel']:
                    reports_data = [export_metadata] + reports_data
            
            # Export data in the specified format
            if format == 'csv':
                file_path = export_to_csv(reports_data, filename)
                if file_path:
                    flash(f"Data exported to CSV successfully. {len(reports_data)} records exported.", "success")
                    return send_file(file_path, as_attachment=True, download_name=os.path.basename(file_path))
                    
            elif format == 'json':
                # For JSON, structure the data differently with metadata section
                if include_metadata:
                    structured_data = {
                        "metadata": export_metadata,
                        "data": reports_data
                    }
                    file_path = export_to_json(structured_data, filename)
                else:
                    file_path = export_to_json(reports_data, filename)
                
                if file_path:
                    flash(f"Data exported to JSON successfully. {len(reports_data)} records exported.", "success")
                    return send_file(file_path, as_attachment=True, download_name=os.path.basename(file_path))
                    
            elif format == 'excel':
                file_path = export_to_excel(reports_data, filename)
                if file_path:
                    flash(f"Data exported to Excel successfully. {len(reports_data)} records exported.", "success")
                    return send_file(file_path, as_attachment=True, download_name=os.path.basename(file_path))
            else:
                flash(f"Unsupported export format: {format}", "danger")
                
        except Exception as e:
            logger.warning(f"Could not export data: {str(e)}")
            flash(f"Error exporting data: {str(e)}", "danger")
            
        finally:
            db_conn.close()
            
    except Exception as e:
        flash(f"Error connecting to database: {str(e)}", "danger")
        logger.exception("Error in export_data route")
    
    return redirect(url_for('reports'))

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    """Settings page for configuring the scraper."""
    if request.method == 'POST':
        try:
            # Get form data
            username = request.form.get('username')
            password = request.form.get('password')
            headless = 'headless' in request.form
            timeout = int(request.form.get('timeout', 30))
            wait_time = int(request.form.get('wait_time', 5))
            retry_attempts = int(request.form.get('retry_attempts', 3))
            
            # Update configuration based on form data
            new_config = {
                'narrpr': {
                    'username': username,
                    'password': password if password else "",  # Don't overwrite with empty password
                    'headless': headless,
                    'timeout': timeout
                },
                'scraping': {
                    'wait_time': wait_time,
                    'retry_attempts': retry_attempts
                }
            }
            
            # Update config file
            result = update_config(new_config)
            
            # If credentials provided, save to database model
            if username and password:
                try:
                    # Check if credentials already exist
                    existing_cred = NarrprCredential.query.first()
                    if existing_cred:
                        # Update existing credentials
                        existing_cred.username = username
                        existing_cred.password = password
                        existing_cred.updated_at = datetime.now()
                    else:
                        # Create new credentials
                        new_cred = NarrprCredential(username=username, password=password)
                        db.session.add(new_cred)
                    
                    db.session.commit()
                    logger.info("NARRPR credentials saved to database")
                    
                    # Add activity log entry
                    activity = ActivityLog(
                        action="update_credentials",
                        details=f"Updated NARRPR credentials for {username}"
                    )
                    db.session.add(activity)
                    db.session.commit()
                except Exception as e:
                    logger.error(f"Error saving credentials to database: {str(e)}")
                    db.session.rollback()
            
            if result:
                flash("Settings updated successfully.", "success")
            else:
                flash("Failed to update settings.", "danger")
                
            return redirect(url_for('settings'))
            
        except Exception as e:
            flash(f"Error updating settings: {str(e)}", "danger")
            logger.exception("Error in settings route")
            return redirect(url_for('settings'))
    
    # Load current configuration
    current_config = load_config()
    
    # Get credentials from database if available
    try:
        cred = NarrprCredential.query.first()
        if cred:
            current_config['narrpr']['username'] = cred.username
            # Don't populate password field with actual password for security
            # current_config['narrpr']['password'] = "••••••••"
    except Exception as e:
        logger.error(f"Error retrieving credentials from database: {str(e)}")
    
    return render_template('settings.html', config=current_config)

@app.route('/api/status')
def api_status():
    """API endpoint to check the status of the application."""
    try:
        # Check database connection
        db_conn = Database()
        db_status = "Connected"
        db_conn.close()
    except Exception:
        db_status = "Disconnected"
    
    status_data = {
        'status': 'active',
        'database': db_status,
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }
    
    return jsonify(status_data)

@app.route('/load-test-data')
def load_test_data():
    """Route to load test data for development and testing."""
    try:
        # Insert test data
        result = insert_test_data()
        
        if result:
            # Add activity log entry
            try:
                activity = ActivityLog(
                    action="load_test_data",
                    details="Inserted sample property data for testing"
                )
                db.session.add(activity)
                db.session.commit()
            except Exception as e:
                logger.error(f"Error adding activity log: {str(e)}")
                
            flash("Test data loaded successfully.", "success")
        else:
            flash("Failed to load test data.", "danger")
            
    except Exception as e:
        flash(f"Error loading test data: {str(e)}", "danger")
        logger.exception("Error in load_test_data route")
        
    return redirect(url_for('reports'))

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error_code=404, error_message="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', error_code=500, error_message="Internal server error"), 500

# Import models
from models import ActivityLog, JobRun, NarrprCredential, AIFeedback

# Import AI API endpoints
try:
    from ai.api.endpoints import ai_api
    from ai.api.model_content import model_content_api
    
    # Register AI blueprints
    app.register_blueprint(ai_api)
    app.register_blueprint(model_content_api)
    
    app.config['AI_ENABLED'] = True
    logger.info("AI modules loaded successfully")
except Exception as e:
    logger.warning(f"Failed to load AI modules: {str(e)}")
    app.config['AI_ENABLED'] = False

# Add route to check AI status
@app.route('/api/ai-status')
def ai_status():
    """API endpoint to check the status of AI capabilities"""
    status_data = {
        'ai_enabled': app.config.get('AI_ENABLED', False),
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }
    
    # Check AI key configuration
    status_data['openai_configured'] = bool(os.environ.get('OPENAI_API_KEY'))
    status_data['anthropic_configured'] = bool(os.environ.get('ANTHROPIC_API_KEY'))
    
    # Check available agents if AI is enabled
    if app.config.get('AI_ENABLED', False):
        status_data['available_agents'] = [
            'text_summarizer',
            'market_analyzer',
            'recommendation_agent',
            'natural_language_search'
        ]
    
    return jsonify(status_data)

@app.route('/ai-demo')
def ai_demo():
    """AI capabilities demonstration page"""
    return render_template('ai_demo.html')

@app.route('/ai-feedback-analytics')
def ai_feedback_analytics():
    """AI feedback analytics dashboard"""
    return render_template('ai_feedback_analytics.html')
    
@app.route('/ai/prompt-testing', methods=['GET'])
def ai_prompt_testing():
    """AI prompt A/B testing page"""
    return render_template('ai_prompt_testing.html')
    
@app.route('/ai/continuous-learning', methods=['GET'])
def ai_continuous_learning():
    """AI continuous learning system page"""
    return render_template('ai_continuous_learning.html')
    
@app.route('/ai/advanced-analytics', methods=['GET'])
def ai_advanced_analytics():
    """AI advanced analytics dashboard"""
    return render_template('ai_advanced_analytics.html')
    
@app.route('/ai/integration-automation', methods=['GET'])
def ai_integration_automation():
    """AI integration and automation configuration page"""
    return render_template('ai_integration_automation.html')
    
# Monitoring routes
@app.route('/monitoring/dashboard', methods=['GET'])
def monitoring_dashboard():
    """Monitoring dashboard overview page"""
    return render_template('monitoring_dashboard.html')
    
@app.route('/monitoring/system', methods=['GET'])
def monitoring_system():
    """System performance monitoring page"""
    return render_template('monitoring_system.html')
    
@app.route('/monitoring/api', methods=['GET'])
def monitoring_api():
    """API performance monitoring page"""
    return render_template('monitoring_api.html')
    
@app.route('/monitoring/database', methods=['GET'])
def monitoring_database():
    """Database performance monitoring page"""
    return render_template('monitoring_database.html')
    
@app.route('/monitoring/ai', methods=['GET'])
def monitoring_ai():
    """AI performance monitoring page"""
    return render_template('monitoring_ai.html')
    
@app.route('/monitoring/alerts/active', methods=['GET'])
def monitoring_alerts_active():
    """Active alerts monitoring page"""
    from models import MonitoringAlert
    
    # Retrieve all active alerts
    alerts = (MonitoringAlert.query.filter(MonitoringAlert.status != 'resolved')
              .order_by(MonitoringAlert.severity, MonitoringAlert.created_at.desc())
              .all())
              
    # Group alerts by severity for easier display
    alerts_by_severity = {
        'critical': [],
        'error': [],
        'warning': [],
        'info': []
    }
    
    for alert in alerts:
        severity = alert.severity.lower()
        if severity in alerts_by_severity:
            alerts_by_severity[severity].append(alert)
        else:
            alerts_by_severity['info'].append(alert)
    
    return render_template('monitoring_alerts_active.html', 
                          alerts=alerts,
                          alerts_by_severity=alerts_by_severity)
    
@app.route('/monitoring/alerts/history', methods=['GET'])
def monitoring_alerts_history():
    """Alert history page"""
    return render_template('monitoring_alerts_history.html')
    
@app.route('/monitoring/reports/scheduled', methods=['GET'])
def monitoring_reports_scheduled():
    """Scheduled reports page"""
    return render_template('monitoring_reports_scheduled.html')
    
@app.route('/monitoring/reports/create', methods=['GET', 'POST'])
def monitoring_reports_create():
    """Create report page"""
    if request.method == 'POST':
        # Handle report creation
        return redirect(url_for('monitoring_reports_scheduled'))
    return render_template('monitoring_reports_create.html')
    
@app.route('/monitoring/reports/history', methods=['GET'])
def monitoring_reports_history():
    """Report execution history page"""
    return render_template('monitoring_reports_history.html')

@app.route('/ai/reports/settings', methods=['GET', 'POST'])
def ai_report_settings():
    """AI feedback report settings page"""
    from models import AIFeedbackReportSettings
    import json
    
    settings = AIFeedbackReportSettings.get_settings()
    
    if request.method == 'POST':
        # Update settings from form data
        settings.admin_email = request.form.get('admin_email')
        
        # Process additional recipients (convert from lines to JSON array)
        additional_recipients = request.form.get('additional_recipients', '')
        if additional_recipients:
            email_list = [email.strip() for email in additional_recipients.split('\n') if email.strip()]
            settings.additional_recipients = json.dumps(email_list)
        else:
            settings.additional_recipients = None
        
        # Update schedule settings
        settings.send_daily_reports = 'send_daily_reports' in request.form
        settings.send_weekly_reports = 'send_weekly_reports' in request.form
        settings.send_monthly_reports = 'send_monthly_reports' in request.form
        
        # Update day settings
        try:
            settings.weekly_report_day = int(request.form.get('weekly_report_day', 0))
        except ValueError:
            settings.weekly_report_day = 0
            
        try:
            settings.monthly_report_day = int(request.form.get('monthly_report_day', 1))
            # Ensure day is between 1-31
            settings.monthly_report_day = max(1, min(31, settings.monthly_report_day))
        except ValueError:
            settings.monthly_report_day = 1
        
        # Update content settings
        settings.include_detailed_feedback = 'include_detailed_feedback' in request.form
        settings.include_csv_attachment = 'include_csv_attachment' in request.form
        settings.include_excel_attachment = 'include_excel_attachment' in request.form
        
        # Save settings
        db.session.commit()
        
        # If admin email is set and scheduler settings have changed, update schedules
        if settings.admin_email:
            from utils.scheduled_tasks import initialize_default_schedules, check_scheduler_status
            
            # Only update schedules if scheduler is running
            if check_scheduler_status():
                initialize_default_schedules(settings.admin_email)
        
        flash('Report settings saved successfully', 'success')
        return redirect(url_for('ai_report_settings'))
    
    # Process additional recipients for display (convert from JSON array to lines)
    additional_recipients = ''
    if settings.additional_recipients:
        try:
            email_list = json.loads(settings.additional_recipients)
            if isinstance(email_list, list):
                additional_recipients = '\n'.join(email_list)
        except:
            # If there's an error parsing JSON, leave it empty
            pass
    
    return render_template('ai_report_settings.html', settings=settings, additional_recipients=additional_recipients)

@app.route('/api/ai/feedback/report/settings', methods=['GET'])
def get_ai_report_settings():
    """API endpoint to get AI feedback report settings"""
    try:
        from models import AIFeedbackReportSettings
        import json
        
        settings = AIFeedbackReportSettings.get_settings()
        
        # Format additional recipients
        additional_recipients = []
        if settings.additional_recipients:
            try:
                additional_recipients = json.loads(settings.additional_recipients)
            except:
                # If there's an error parsing JSON, leave it as an empty list
                pass
        
        return jsonify({
            "status": "success",
            "settings": {
                "admin_email": settings.admin_email,
                "additional_recipients": additional_recipients,
                "send_daily_reports": settings.send_daily_reports,
                "send_weekly_reports": settings.send_weekly_reports,
                "send_monthly_reports": settings.send_monthly_reports,
                "weekly_report_day": settings.weekly_report_day,
                "monthly_report_day": settings.monthly_report_day,
                "include_detailed_feedback": settings.include_detailed_feedback,
                "include_csv_attachment": settings.include_csv_attachment,
                "include_excel_attachment": settings.include_excel_attachment
            }
        })
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error getting AI report settings: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Initialize database tables
with app.app_context():
    # Create tables
    db.create_all()

# Main entry point
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
