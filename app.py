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

# Register Jinja filters
@app.template_filter('datetime')
@app.template_filter('format_datetime')
def format_datetime(value):
    """Format a datetime object to a readable string."""
    if not value:
        return ""
    if isinstance(value, str):
        try:
            from datetime import datetime
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return value
    
    try:
        # Format: January 1, 2025 at 12:00 PM
        return value.strftime("%B %d, %Y at %I:%M %p")
    except (ValueError, TypeError, AttributeError):
        return str(value)

@app.template_filter('number')
@app.template_filter('format_number')
def format_number(value):
    """Format a number with thousand separators."""
    if value is None:
        return ""
    try:
        return "{:,}".format(int(float(value)))
    except (ValueError, TypeError):
        return str(value)

@app.template_filter('date')
@app.template_filter('format_date')
def format_date(value):
    """Format a date object to a readable string."""
    if not value:
        return ""
    if isinstance(value, str):
        try:
            from datetime import datetime
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return value
    
    try:
        # Format: January 1, 2025
        return value.strftime("%B %d, %Y")
    except (ValueError, TypeError, AttributeError):
        return str(value)

# Register blueprints
try:
    from app_monitor import monitor_bp
    app.register_blueprint(monitor_bp)
    logger.info("Registered monitoring blueprint")
except ImportError:
    logger.warning("Could not import monitoring blueprint")

# Register Zillow API blueprint
try:
    from api.zillow_routes import zillow_api
    app.register_blueprint(zillow_api)
    logger.info("Registered Zillow API blueprint")
except ImportError:
    logger.warning("Could not import Zillow API blueprint")

# Register ETL API blueprint
try:
    from api.etl_routes import register_etl_blueprint
    register_etl_blueprint(app)
    logger.info("Registered ETL API blueprint")
except ImportError:
    logger.warning("Could not import ETL API blueprint")

# Register ETL Schedule API blueprint
try:
    from api.schedule_routes import register_schedule_blueprint
    register_schedule_blueprint(app)
    logger.info("Registered ETL schedule API blueprint")
except ImportError:
    logger.warning("Could not import ETL schedule API blueprint")

# Register Authentication API blueprint
try:
    from api.auth import register_auth_blueprint
    register_auth_blueprint(app)
    logger.info("Registered authentication API blueprint")
except ImportError:
    logger.warning("Could not import authentication API blueprint")
    
# Register CMA API blueprint
try:
    from api.cma_routes import register_routes as register_cma_api_routes
    register_cma_api_routes(app)
    logger.info("Registered CMA API blueprint")
except ImportError:
    logger.warning("Could not import CMA API blueprint")
    
# Register CMA controller blueprint
try:
    from controllers.cma_controller import register_cma_blueprint
    register_cma_blueprint(app)
    logger.info("Registered CMA controller blueprint")
except ImportError:
    logger.warning("Could not import CMA controller blueprint")

# Register Voice API blueprint
try:
    from api.voice.routes import register_voice_api_blueprint
    register_voice_api_blueprint(app)
    logger.info("Registered voice API blueprint")
except ImportError:
    logger.warning("Could not import voice API blueprint")
    
# Register Voice controller blueprint
try:
    from controllers.voice_controller import register_voice_blueprint
    register_voice_blueprint(app)
    logger.info("Registered voice controller blueprint")
except ImportError:
    logger.warning("Could not import voice controller blueprint")

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

@app.route('/advanced-scraper', methods=['GET', 'POST'])
def advanced_scraper():
    """Run the NARRPR scraper with advanced options for multiple sections."""
    if request.method == 'POST':
        try:
            # Load credentials from form or environment variables
            username = request.form.get('username') or os.getenv("NARRPR_USERNAME")
            password = request.form.get('password') or os.getenv("NARRPR_PASSWORD")
            
            if not username or not password:
                flash("Missing credentials. Please provide username and password.", "danger")
                return redirect(url_for('advanced_scraper'))
            
            # Build scrape options from form data
            scrape_options = {
                'scrape_reports': 'scrape_reports' in request.form,
                'property_ids': [id.strip() for id in request.form.get('property_ids', '').split(',') if id.strip()],
                'location_ids': [id.strip() for id in request.form.get('location_ids', '').split(',') if id.strip()],
                'zip_codes': [zip.strip() for zip in request.form.get('zip_codes', '').split(',') if zip.strip()],
                'neighborhood_ids': [id.strip() for id in request.form.get('neighborhood_ids', '').split(',') if id.strip()],
                'scrape_valuations': 'scrape_valuations' in request.form,
                'scrape_comparables': 'scrape_comparables' in request.form
            }
            
            # Check if any scraping option is selected
            if not (scrape_options['scrape_reports'] or 
                    scrape_options['property_ids'] or 
                    scrape_options['location_ids'] or 
                    scrape_options['zip_codes'] or 
                    scrape_options['neighborhood_ids']):
                flash("No scraping options selected. Please select at least one section to scrape.", "warning")
                return redirect(url_for('advanced_scraper'))
            
            # Store the scrape options for the workflow to use
            session['scrape_options'] = scrape_options
            
            # Import here to avoid circular import
            from main import run_etl_workflow
            
            # Run the ETL workflow with the advanced options
            with app.app_context():
                result = run_etl_workflow(scrape_options)
            
            if result:
                # Build success message based on data scraped
                success_parts = []
                
                if scrape_options['scrape_reports']:
                    success_parts.append("Reports")
                    
                if scrape_options['property_ids']:
                    success_parts.append(f"Property details ({len(scrape_options['property_ids'])} properties)")
                    
                    if scrape_options['scrape_valuations']:
                        success_parts.append("Property valuations")
                        
                    if scrape_options['scrape_comparables']:
                        success_parts.append("Comparable properties")
                
                if scrape_options['location_ids'] or scrape_options['zip_codes']:
                    area_count = len(scrape_options['location_ids']) + len(scrape_options['zip_codes'])
                    success_parts.append(f"Market activity ({area_count} areas)")
                
                if scrape_options['neighborhood_ids']:
                    success_parts.append(f"Neighborhood data ({len(scrape_options['neighborhood_ids'])} neighborhoods)")
                
                success_message = "Successfully scraped: " + ", ".join(success_parts)
                flash(f"{success_message}. Data saved to CSV and database.", "success")
                
                return redirect(url_for('reports'))
            else:
                flash("Scraping process completed but no data was retrieved.", "warning")
                return redirect(url_for('advanced_scraper'))
            
        except Exception as e:
            flash(f"Error running advanced scraper: {str(e)}", "danger")
            logger.exception("Error in advanced_scraper route")
            return redirect(url_for('advanced_scraper'))
    
    return render_template('advanced_scraper.html')

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
# Import directly from models.py to avoid circular import issues
# Commented out for now to allow the zillow routes to work
# from models import ActivityLog, JobRun, NarrprCredential, AIFeedback

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
    from models import (
        MonitoringAlert, SystemMetric, APIUsageLog, 
        AIAgentMetrics, JobRun, ScheduledReport,
        PropertyLocation, PriceTrend
    )
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    # Time periods for metrics
    now = datetime.now()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    last_30d = now - timedelta(days=30)
    
    # Get alert metrics
    alerts_summary = {
        'active': {
            'total': MonitoringAlert.query.filter_by(status='active').count(),
            'critical': MonitoringAlert.query.filter_by(status='active', severity='critical').count(),
            'error': MonitoringAlert.query.filter_by(status='active', severity='error').count(),
            'warning': MonitoringAlert.query.filter_by(status='active', severity='warning').count(),
            'info': MonitoringAlert.query.filter_by(status='active', severity='info').count(),
        },
        'latest': MonitoringAlert.query.order_by(MonitoringAlert.created_at.desc()).limit(5).all(),
        'last_24h': MonitoringAlert.query.filter(MonitoringAlert.created_at >= last_24h).count(),
        'last_7d': MonitoringAlert.query.filter(MonitoringAlert.created_at >= last_7d).count(),
    }
    
    # Get system metrics
    system_metrics = {
        'latest': SystemMetric.query.filter_by(
            component='system'
        ).order_by(SystemMetric.timestamp.desc()).limit(10).all(),
        'performance': {
            'cpu': SystemMetric.query.filter_by(
                metric_name='cpu_percent', 
                component='system'
            ).order_by(SystemMetric.timestamp.desc()).first(),
            'memory': SystemMetric.query.filter_by(
                metric_name='memory_percent', 
                component='system'
            ).order_by(SystemMetric.timestamp.desc()).first(),
            'disk': SystemMetric.query.filter_by(
                metric_name='disk_percent', 
                component='system'
            ).order_by(SystemMetric.timestamp.desc()).first(),
        }
    }
    
    # Get API metrics
    api_metrics = {
        'total_requests_24h': APIUsageLog.query.filter(
            APIUsageLog.timestamp >= last_24h
        ).count(),
        'error_rate_24h': db.session.query(
            func.cast(
                func.count(APIUsageLog.id).filter(APIUsageLog.status_code >= 400) * 100.0, 
                db.Float
            ) / func.nullif(func.count(APIUsageLog.id), 0)
        ).filter(APIUsageLog.timestamp >= last_24h).scalar() or 0,
        'avg_response_time': db.session.query(
            func.avg(APIUsageLog.response_time)
        ).filter(APIUsageLog.timestamp >= last_24h).scalar() or 0,
    }
    
    # Get database metrics
    database_metrics = {
        'connection_count': SystemMetric.query.filter_by(
            metric_name='db_connection_count', 
            component='database'
        ).order_by(SystemMetric.timestamp.desc()).first(),
        'query_time_avg': SystemMetric.query.filter_by(
            metric_name='db_query_time_avg', 
            component='database'
        ).order_by(SystemMetric.timestamp.desc()).first(),
    }
    
    # Get AI metrics
    ai_metrics = {
        'total_requests_24h': db.session.query(
            func.sum(AIAgentMetrics.request_count)
        ).filter(AIAgentMetrics.date >= last_24h.date()).scalar() or 0,
        'avg_rating': db.session.query(
            func.avg(AIAgentMetrics.average_rating)
        ).filter(AIAgentMetrics.date >= last_7d.date()).scalar() or 0,
        'agent_performance': AIAgentMetrics.query.filter(
            AIAgentMetrics.date >= last_7d.date()
        ).order_by(AIAgentMetrics.date.desc()).all(),
    }
    
    # Get job metrics
    job_metrics = {
        'total_jobs_30d': JobRun.query.filter(JobRun.start_time >= last_30d).count(),
        'success_rate_30d': db.session.query(
            func.cast(
                func.count(JobRun.id).filter(JobRun.status == 'completed') * 100.0, 
                db.Float
            ) / func.nullif(func.count(JobRun.id), 0)
        ).filter(JobRun.start_time >= last_30d).scalar() or 0,
        'latest_jobs': JobRun.query.order_by(JobRun.start_time.desc()).limit(5).all(),
    }
    
    # Get report metrics
    report_metrics = {
        'total_scheduled': ScheduledReport.query.filter_by(is_active=True).count(),
        'upcoming': ScheduledReport.query.filter_by(is_active=True).all(),
    }
    
    # Calculate system health score (0-100)
    health_score = 100
    
    # Reduce score based on active critical/error alerts
    critical_count = alerts_summary['active']['critical']
    error_count = alerts_summary['active']['error']
    health_score -= critical_count * 10  # -10 points per critical alert
    health_score -= error_count * 5      # -5 points per error alert
    
    # Reduce score based on system metrics if available
    if system_metrics['performance']['cpu']:
        cpu_percent = system_metrics['performance']['cpu'].metric_value
        if cpu_percent > 90:
            health_score -= 15
        elif cpu_percent > 80:
            health_score -= 10
        elif cpu_percent > 70:
            health_score -= 5
            
    if system_metrics['performance']['memory']:
        memory_percent = system_metrics['performance']['memory'].metric_value
        if memory_percent > 90:
            health_score -= 15
        elif memory_percent > 80:
            health_score -= 10
        elif memory_percent > 70:
            health_score -= 5
    
    # Reduce score based on API error rate
    if api_metrics['error_rate_24h'] > 5:
        health_score -= 15
    elif api_metrics['error_rate_24h'] > 2:
        health_score -= 10
    elif api_metrics['error_rate_24h'] > 1:
        health_score -= 5
        
    # Clamp health score between 0 and 100
    health_score = max(0, min(100, health_score))
    
    # Determine health status based on score
    if health_score >= 90:
        health_status = 'excellent'
    elif health_score >= 75:
        health_status = 'good'
    elif health_score >= 50:
        health_status = 'fair'
    elif health_score >= 25:
        health_status = 'poor'
    else:
        health_status = 'critical'
    
    # Get current time
    from datetime import datetime
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Get property location stats 
    location_stats = {
        'total_properties': PropertyLocation.query.count(),
        'distinct_cities': db.session.query(PropertyLocation.city).distinct().count()
    }
    
    # Get price trend stats
    price_stats = {
        'median_price': '$450K',  # Default value
        'trend_indicator': '+5.3%'  # Default value
    }
    
    try:
        # Calculate median price for the most recent date
        latest_date = db.session.query(func.max(PriceTrend.date)).scalar()
        if latest_date:
            # Get median price for latest date across all cities
            latest_trends = PriceTrend.query.filter(PriceTrend.date == latest_date).all()
            if latest_trends:
                prices = [trend.median_price for trend in latest_trends if trend.median_price]
                if prices:
                    median = sorted(prices)[len(prices)//2]
                    # Format as a dollar value with K for thousands
                    median_price_k = int(median / 1000)
                    price_stats['median_price'] = f"${median_price_k}K"
                
                # Get average price change - using existing price_change field
                changes = []
                for trend in latest_trends:
                    if hasattr(trend, 'price_change') and trend.price_change is not None:
                        changes.append(trend.price_change)
                
                if changes:
                    avg_change = sum(changes) / len(changes)
                    price_stats['trend_indicator'] = f"{'+' if avg_change >= 0 else ''}{avg_change:.1f}%"
    except Exception as e:
        logger.warning(f"Could not retrieve price trend stats: {str(e)}")
    
    return render_template(
        'monitoring_dashboard.html',
        alerts_summary=alerts_summary,
        system_metrics=system_metrics,
        api_metrics=api_metrics,
        database_metrics=database_metrics,
        ai_metrics=ai_metrics,
        job_metrics=job_metrics,
        report_metrics=report_metrics,
        health_score=health_score,
        health_status=health_status,
        current_time=current_time,
        location_stats=location_stats,
        price_stats=price_stats
    )
    
@app.route('/monitoring/system', methods=['GET'])
def monitoring_system():
    """System performance monitoring page"""
    return render_template('monitoring_system.html')
    
@app.route('/monitoring/api', methods=['GET'])
def monitoring_api():
    """API performance monitoring page"""
    return render_template('monitoring_api.html')

@app.route('/api/location/data', methods=['GET'])
def api_location_data():
    """API endpoint for location data to power geographical visualization."""
    try:
        from models import PropertyLocation
        from sqlalchemy import func
        
        # Get query parameters
        city = request.args.get('city')
        state = request.args.get('state')
        zip_code = request.args.get('zip_code')
        limit = request.args.get('limit', default=100, type=int)
        
        # Build query
        query = PropertyLocation.query
        
        # Apply filters if provided
        if city:
            query = query.filter(func.lower(PropertyLocation.city) == city.lower())
        if state:
            query = query.filter(func.lower(PropertyLocation.state) == state.lower())
        if zip_code:
            query = query.filter(PropertyLocation.zip_code == zip_code)
            
        # Get locations with limit
        locations = query.limit(limit).all()
        
        # Convert to JSON-serializable format
        location_data = []
        for loc in locations:
            location_data.append({
                'id': loc.id,
                'address': loc.full_address,
                'street': loc.street_address,
                'city': loc.city,
                'state': loc.state,
                'zip_code': loc.zip_code,
                'latitude': float(loc.latitude) if loc.latitude else None,
                'longitude': float(loc.longitude) if loc.longitude else None,
                'property_type': loc.property_type,
                'year_built': loc.year_built,
                'report_id': loc.report_id
            })
        
        return jsonify({
            'status': 'success',
            'count': len(location_data),
            'data': location_data
        })
    except Exception as e:
        logger.error(f"Error retrieving location data: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
        
@app.route('/api/price-trends', methods=['GET'])
def api_price_trends():
    """API endpoint for price trend data for visualization."""
    try:
        from models import PriceTrend
        from sqlalchemy import func
        
        # Get query parameters
        city = request.args.get('city')
        state = request.args.get('state')
        zip_code = request.args.get('zip_code')
        time_period = request.args.get('period', default='all')
        
        # Build query
        query = PriceTrend.query
        
        # Apply filters if provided
        if city:
            query = query.filter(func.lower(PriceTrend.city) == city.lower())
        if state:
            query = query.filter(func.lower(PriceTrend.state) == state.lower())
        if zip_code:
            query = query.filter(PriceTrend.zip_code == zip_code)
            
        # Apply time period filter
        if time_period != 'all':
            from datetime import datetime, timedelta
            end_date = datetime.now()
            
            if time_period == '1m':
                start_date = end_date - timedelta(days=30)
            elif time_period == '3m':
                start_date = end_date - timedelta(days=90)
            elif time_period == '6m':
                start_date = end_date - timedelta(days=180)
            elif time_period == '1y':
                start_date = end_date - timedelta(days=365)
            elif time_period == '2y':
                start_date = end_date - timedelta(days=730)
            else:
                start_date = end_date - timedelta(days=30)  # Default to 1 month
                
            query = query.filter(PriceTrend.date >= start_date)
        
        # Order by date
        query = query.order_by(PriceTrend.date)
        
        # Execute query
        trends = query.all()
        
        # Convert to JSON-serializable format
        trend_data = []
        for trend in trends:
            trend_data.append({
                'id': trend.id,
                'city': trend.city,
                'state': trend.state,
                'zip_code': trend.zip_code,
                'date': trend.date.isoformat() if trend.date else None,
                'median_price': float(trend.median_price) if trend.median_price else None,
                'avg_price': float(trend.avg_price) if trend.avg_price else None,
                'price_change': float(trend.price_change) if hasattr(trend, 'price_change') and trend.price_change is not None else None,
                'properties_sold': trend.properties_sold if hasattr(trend, 'properties_sold') else None
            })
        
        # Get aggregated statistics
        stats = {}
        if trend_data:
            try:
                # Calculate metrics by city
                cities = {}
                for trend in trend_data:
                    city = trend['city']
                    if city not in cities:
                        cities[city] = {
                            'median_prices': [],
                            'avg_prices': [],
                            'transactions': 0
                        }
                    
                    if trend['median_price'] is not None:
                        cities[city]['median_prices'].append(trend['median_price'])
                    if trend['avg_price'] is not None:
                        cities[city]['avg_prices'].append(trend['avg_price'])
                    if trend['properties_sold'] is not None:
                        cities[city]['transactions'] += trend['properties_sold']
                
                # Calculate aggregate stats
                for city, data in cities.items():
                    if data['median_prices']:
                        cities[city]['avg_median_price'] = sum(data['median_prices']) / len(data['median_prices'])
                    if data['avg_prices']:
                        cities[city]['avg_avg_price'] = sum(data['avg_prices']) / len(data['avg_prices'])
                
                stats = cities
            except Exception as calc_err:
                logger.warning(f"Error calculating trend statistics: {str(calc_err)}")
                stats = {}
        
        return jsonify({
            'status': 'success',
            'count': len(trend_data),
            'data': trend_data,
            'stats': stats
        })
    except Exception as e:
        logger.error(f"Error retrieving price trend data: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    
@app.route('/monitoring/database', methods=['GET'])
def monitoring_database():
    """Database performance monitoring page"""
    from utils.db_metrics import get_all_db_metrics
    
    # Get real database metrics
    db_metrics = get_all_db_metrics()
    
    return render_template('monitoring_database.html', db_metrics=db_metrics)

@app.route('/monitoring/api/database-metrics', methods=['GET'])
def api_database_metrics():
    """API endpoint for fetching database metrics"""
    from utils.db_metrics import get_all_db_metrics
    
    # Get real database metrics
    db_metrics = get_all_db_metrics()
    
    return jsonify(db_metrics)
    
@app.route('/monitoring/ai', methods=['GET'])
def monitoring_ai():
    """AI performance monitoring page"""
    return render_template('monitoring_ai.html')
    
@app.route('/monitoring/locations', methods=['GET'])
def monitoring_locations():
    """Property locations map visualization page"""
    # Get available states and cities for filters
    try:
        from models import PropertyLocation
        from sqlalchemy import func
        
        states = db.session.query(PropertyLocation.state).distinct().order_by(PropertyLocation.state).all()
        states = [state[0] for state in states if state[0]]
        
        cities = db.session.query(PropertyLocation.city).distinct().order_by(PropertyLocation.city).all()
        cities = [city[0] for city in cities if city[0]]
        
        # Get location count
        location_count = PropertyLocation.query.count()
        
    except Exception as e:
        logger.error(f"Error retrieving location filters: {str(e)}")
        states = []
        cities = []
        location_count = 0
    
    return render_template('monitoring_locations.html', 
                          states=states,
                          cities=cities,
                          location_count=location_count)
                          
@app.route('/monitoring/price-trends', methods=['GET'])
def monitoring_price_trends():
    """Price trends visualization page"""
    # Get available states and cities for filters
    try:
        from models import PriceTrend
        from sqlalchemy import func
        
        states = db.session.query(PriceTrend.state).distinct().order_by(PriceTrend.state).all()
        states = [state[0] for state in states if state[0]]
        
        cities = db.session.query(PriceTrend.city).distinct().order_by(PriceTrend.city).all()
        cities = [city[0] for city in cities if city[0]]
        
        # Get trend date range
        min_date = db.session.query(func.min(PriceTrend.date)).scalar()
        max_date = db.session.query(func.max(PriceTrend.date)).scalar()
        
        date_range = {
            'min': min_date.strftime('%Y-%m-%d') if min_date else None,
            'max': max_date.strftime('%Y-%m-%d') if max_date else None
        }
        
        # Get counts
        trend_count = PriceTrend.query.count()
        city_count = len(cities)
        
    except Exception as e:
        logger.error(f"Error retrieving price trend filters: {str(e)}")
        states = []
        cities = []
        date_range = {'min': None, 'max': None}
        trend_count = 0
        city_count = 0
    
    return render_template('monitoring_price_trends.html', 
                          states=states,
                          cities=cities,
                          date_range=date_range,
                          trend_count=trend_count,
                          city_count=city_count)
                          
@app.route('/api/property/search', methods=['GET'])
def api_property_search():
    """API endpoint for searching properties."""
    try:
        from models import PropertyLocation
        from sqlalchemy import func, or_
        
        # Get filter parameters
        property_type = request.args.get('property_type')
        city = request.args.get('city')
        state = request.args.get('state')
        min_price = request.args.get('min_price', type=int)
        max_price = request.args.get('max_price', type=int)
        min_beds = request.args.get('min_beds', type=int)
        max_beds = request.args.get('max_beds', type=int)
        min_baths = request.args.get('min_baths', type=float)
        max_baths = request.args.get('max_baths', type=float)
        limit = request.args.get('limit', default=20, type=int)
        
        # Build query
        query = PropertyLocation.query
        
        # Apply filters if provided
        if property_type:
            query = query.filter(PropertyLocation.property_type == property_type)
        if city:
            query = query.filter(func.lower(PropertyLocation.city) == city.lower())
        if state:
            query = query.filter(func.lower(PropertyLocation.state) == state.lower())
            
        # Price filters - convert to cents
        if min_price:
            query = query.filter(PropertyLocation.price_value >= min_price * 100)
        if max_price:
            query = query.filter(PropertyLocation.price_value <= max_price * 100)
            
        # Bedroom filters
        if min_beds:
            query = query.filter(PropertyLocation.bedrooms >= min_beds)
        if max_beds:
            query = query.filter(PropertyLocation.bedrooms <= max_beds)
            
        # Bathroom filters
        if min_baths:
            query = query.filter(PropertyLocation.bathrooms >= min_baths)
        if max_baths:
            query = query.filter(PropertyLocation.bathrooms <= max_baths)
            
        # Limit results and execute query
        properties = query.order_by(PropertyLocation.id).limit(limit).all()
        
        # Convert to JSON-serializable format
        results = []
        for prop in properties:
            # Calculate price per square foot
            price_per_sqft = None
            if prop.price_value and prop.square_feet and prop.square_feet > 0:
                price_per_sqft = round(prop.price_value / prop.square_feet / 100, 2)
                
            results.append({
                'id': prop.id,
                'property_type': prop.property_type,
                'address': prop.street_address,
                'city': prop.city,
                'state': prop.state,
                'zip_code': prop.zip_code,
                'price': int(prop.price_value / 100) if prop.price_value else None,
                'bedrooms': prop.bedrooms,
                'bathrooms': prop.bathrooms,
                'square_feet': prop.square_feet,
                'year_built': prop.year_built,
                'price_per_sqft': price_per_sqft,
                'latitude': float(prop.latitude) if prop.latitude else None,
                'longitude': float(prop.longitude) if prop.longitude else None
            })
        
        return jsonify({
            'status': 'success',
            'count': len(results),
            'data': results
        })
    except Exception as e:
        logger.error(f"Error searching properties: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/property/comparison', methods=['GET'])
def property_comparison():
    """One-click property comparison dashboard"""
    try:
        from models import PropertyLocation
        from sqlalchemy import func
        
        # Get all property types
        property_types = db.session.query(PropertyLocation.property_type).distinct().order_by(PropertyLocation.property_type).all()
        property_types = [p[0] for p in property_types if p[0]]
        
        # Get all states and cities
        states = db.session.query(PropertyLocation.state).distinct().order_by(PropertyLocation.state).all()
        states = [state[0] for state in states if state[0]]
        
        cities = db.session.query(PropertyLocation.city).distinct().order_by(PropertyLocation.city).all()
        cities = [city[0] for city in cities if city[0]]
        
        # Get selected properties IDs from query parameters
        selected_ids = request.args.getlist('property_id', type=int)
        
        # Get selected properties if any
        selected_properties = []
        if selected_ids:
            selected_properties = PropertyLocation.query.filter(PropertyLocation.id.in_(selected_ids)).all()
        
        # Get comparable properties for suggestions
        suggested_properties = []
        if len(selected_properties) > 0 and len(selected_properties) < 4:
            # Get the first selected property to find comparable ones
            base_property = selected_properties[0]
            
            # Find properties with similar characteristics
            query = PropertyLocation.query.filter(
                PropertyLocation.id != base_property.id,  # Exclude the base property
                PropertyLocation.property_type == base_property.property_type,  # Same property type
                PropertyLocation.city == base_property.city,  # Same city
                PropertyLocation.state == base_property.state  # Same state
            )
            
            # Exclude already selected properties
            if len(selected_properties) > 1:
                other_ids = [p.id for p in selected_properties[1:]]
                query = query.filter(~PropertyLocation.id.in_(other_ids))
                
            # Get up to 5 suggested properties
            suggested_properties = query.limit(5).all()
        
        # Get global stats for comparison context
        avg_price = db.session.query(func.avg(PropertyLocation.price_value)).scalar() or 0
        avg_price = int(avg_price / 100)  # Convert cents to dollars
        
        min_price = db.session.query(func.min(PropertyLocation.price_value)).scalar() or 0
        min_price = int(min_price / 100)  # Convert cents to dollars
        
        max_price = db.session.query(func.max(PropertyLocation.price_value)).scalar() or 0
        max_price = int(max_price / 100)  # Convert cents to dollars
        
        avg_sqft = db.session.query(func.avg(PropertyLocation.square_feet)).scalar() or 0
        avg_sqft = int(avg_sqft)
        
        # Calculate price per square foot for each selected property
        for prop in selected_properties:
            if prop.price_value and prop.square_feet and prop.square_feet > 0:
                prop.price_per_sqft = int(prop.price_value / prop.square_feet / 100)  # Convert to dollars per sqft
            else:
                prop.price_per_sqft = None
        
        return render_template('property_comparison.html',
                            property_types=property_types,
                            states=states,
                            cities=cities,
                            selected_properties=selected_properties,
                            suggested_properties=suggested_properties,
                            avg_price=avg_price,
                            min_price=min_price,
                            max_price=max_price,
                            avg_sqft=avg_sqft)
                            
    except Exception as e:
        logger.error(f"Error loading property comparison page: {str(e)}")
        return render_template('property_comparison.html',
                            property_types=[],
                            states=[],
                            cities=[],
                            selected_properties=[],
                            suggested_properties=[],
                            avg_price=0,
                            min_price=0,
                            max_price=0,
                            avg_sqft=0,
                            error=str(e))
    
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
                          
@app.route('/monitoring/alerts/<int:alert_id>/acknowledge', methods=['POST'])
def acknowledge_alert(alert_id):
    """Acknowledge an alert."""
    from models import MonitoringAlert
    
    alert = MonitoringAlert.query.get_or_404(alert_id)
    
    if alert.status == 'resolved':
        flash('This alert is already resolved.', 'warning')
    else:
        alert.status = 'acknowledged'
        alert.acknowledged_at = datetime.now()
        db.session.commit()
        flash('Alert acknowledged successfully.', 'success')
    
    return redirect(url_for('monitoring_alerts_active'))

@app.route('/monitoring/alerts/<int:alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    """Resolve an alert."""
    from models import MonitoringAlert
    
    alert = MonitoringAlert.query.get_or_404(alert_id)
    
    if alert.status == 'resolved':
        flash('This alert is already resolved.', 'warning')
    else:
        alert.status = 'resolved'
        alert.resolved_at = datetime.now()
        db.session.commit()
        flash('Alert resolved successfully.', 'success')
    
    return redirect(url_for('monitoring_alerts_active'))
    
@app.route('/monitoring/alerts/history', methods=['GET'])
def monitoring_alerts_history():
    """Alert history page"""
    from models import MonitoringAlert
    
    # Get query parameters
    days = request.args.get('days', default=30, type=int)
    severity = request.args.get('severity', default=None)
    component = request.args.get('component', default=None)
    status = request.args.get('status', default=None)
    
    # Build query
    query = MonitoringAlert.query
    
    # Apply filters
    if days > 0:
        from datetime import datetime, timedelta
        cutoff_date = datetime.now() - timedelta(days=days)
        query = query.filter(MonitoringAlert.created_at >= cutoff_date)
        
    if severity:
        query = query.filter(MonitoringAlert.severity == severity)
        
    if component:
        query = query.filter(MonitoringAlert.component == component)
        
    if status:
        query = query.filter(MonitoringAlert.status == status)
    
    # Execute query with sorting
    alerts = query.order_by(MonitoringAlert.created_at.desc()).all()
    
    # Get unique values for filter dropdowns
    all_components = db.session.query(MonitoringAlert.component).distinct().all()
    components = [c[0] for c in all_components]
    
    severities = ['critical', 'error', 'warning', 'info']
    statuses = ['active', 'acknowledged', 'resolved']
    
    return render_template('monitoring_alerts_history.html', 
                          alerts=alerts,
                          components=components,
                          severities=severities,
                          statuses=statuses,
                          current_days=days,
                          current_severity=severity,
                          current_component=component,
                          current_status=status)
    
@app.route('/monitoring/reports/scheduled', methods=['GET'])
def monitoring_reports_scheduled():
    """Scheduled reports page"""
    from models import ScheduledReport
    import json
    
    reports = ScheduledReport.query.order_by(ScheduledReport.is_active.desc(), ScheduledReport.name).all()
    
    # Calculate recipients count for each report
    for report in reports:
        if report.recipients:
            try:
                recipients = json.loads(report.recipients)
                report.recipients_count = len(recipients) if isinstance(recipients, list) else 0
            except:
                report.recipients_count = 0
        else:
            report.recipients_count = 0
    
    return render_template('monitoring_reports_scheduled.html', reports=reports)
    
@app.route('/monitoring/reports/create', methods=['GET', 'POST'])
def monitoring_reports_create():
    """Create report page"""
    from models import ScheduledReport
    import json
    
    if request.method == 'POST':
        # Get form data
        name = request.form.get('name')
        report_type = request.form.get('report_type')
        schedule_type = request.form.get('schedule_type')
        cron_expression = request.form.get('cron_expression')
        format_type = request.form.get('format')
        is_active = 'is_active' in request.form
        
        # Process recipients
        recipients_text = request.form.get('recipients', '')
        recipients = [email.strip() for email in recipients_text.split('\n') if email.strip()]
        
        # Process parameters
        parameters = {}
        days = request.form.get('days')
        if days:
            try:
                parameters['days'] = int(days)
            except ValueError:
                pass
                
        component = request.form.get('component')
        if component:
            parameters['component'] = component
            
        severity = request.form.get('severity')
        if severity:
            parameters['severity'] = severity
            
        status = request.form.get('status')
        if status:
            parameters['status'] = status
        
        # Create report
        report = ScheduledReport(
            name=name,
            report_type=report_type,
            schedule_type=schedule_type,
            cron_expression=cron_expression if schedule_type == 'custom' else None,
            format=format_type,
            recipients=json.dumps(recipients),
            parameters=json.dumps(parameters) if parameters else None,
            is_active=is_active
        )
        
        db.session.add(report)
        db.session.commit()
        
        flash('Report created successfully', 'success')
        return redirect(url_for('monitoring_reports_scheduled'))
        
    # Get components for filter selection
    from models import MonitoringAlert
    all_components = db.session.query(MonitoringAlert.component).distinct().all()
    components = [c[0] for c in all_components if c[0]]
    
    return render_template(
        'monitoring_reports_create.html',
        components=components
    )
    
@app.route('/monitoring/reports/run/<int:report_id>', methods=['POST'])
def monitoring_reports_run(report_id):
    """Run a scheduled report immediately"""
    from models import ScheduledReport
    from utils.report_generator import ReportGenerator
    from datetime import datetime
    
    report = ScheduledReport.query.get_or_404(report_id)
    
    try:
        # Process the report
        success = ReportGenerator.process_scheduled_report(report.id)
        
        if success:
            # Update last_run timestamp
            report.last_run = datetime.now()
            db.session.commit()
            
            flash('Report generated and sent successfully', 'success')
        else:
            flash('Error generating report', 'danger')
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error running report {report.id}: {str(e)}")
        flash(f'Error running report: {str(e)}', 'danger')
    
    return redirect(url_for('monitoring_reports_scheduled'))
    
@app.route('/monitoring/reports/edit/<int:report_id>', methods=['GET', 'POST'])
def monitoring_reports_edit(report_id):
    """Edit a scheduled report"""
    from models import ScheduledReport
    import json
    
    report = ScheduledReport.query.get_or_404(report_id)
    
    if request.method == 'POST':
        # Update report
        report.name = request.form.get('name')
        report.report_type = request.form.get('report_type')
        report.schedule_type = request.form.get('schedule_type')
        report.cron_expression = request.form.get('cron_expression') if request.form.get('schedule_type') == 'custom' else None
        report.format = request.form.get('format')
        report.is_active = 'is_active' in request.form
        
        # Process recipients
        recipients_text = request.form.get('recipients', '')
        recipients = [email.strip() for email in recipients_text.split('\n') if email.strip()]
        report.recipients = json.dumps(recipients)
        
        # Process parameters
        parameters = {}
        days = request.form.get('days')
        if days:
            try:
                parameters['days'] = int(days)
            except ValueError:
                pass
                
        component = request.form.get('component')
        if component:
            parameters['component'] = component
            
        severity = request.form.get('severity')
        if severity:
            parameters['severity'] = severity
            
        status = request.form.get('status')
        if status:
            parameters['status'] = status
            
        report.parameters = json.dumps(parameters) if parameters else None
        
        db.session.commit()
        
        # Update scheduler if needed
        from utils.scheduled_tasks import schedule_reports, check_scheduler_status
        if check_scheduler_status():
            schedule_reports()
        
        flash('Report updated successfully', 'success')
        return redirect(url_for('monitoring_reports_scheduled'))
    
    # Format recipients for display
    recipients_text = ''
    if report.recipients:
        try:
            recipients = json.loads(report.recipients)
            if isinstance(recipients, list):
                recipients_text = '\n'.join(recipients)
        except:
            pass
    
    # Parse parameters
    parameters = {}
    if report.parameters:
        try:
            parameters = json.loads(report.parameters)
        except:
            pass
    
    # Get components for filter selection
    from models import MonitoringAlert
    all_components = db.session.query(MonitoringAlert.component).distinct().all()
    components = [c[0] for c in all_components if c[0]]
    
    return render_template(
        'monitoring_reports_edit.html',
        report=report,
        recipients=recipients_text,
        parameters=parameters,
        components=components
    )
    
@app.route('/monitoring/reports/delete/<int:report_id>', methods=['POST'])
def monitoring_reports_delete(report_id):
    """Delete a scheduled report"""
    from models import ScheduledReport
    
    report = ScheduledReport.query.get_or_404(report_id)
    
    db.session.delete(report)
    db.session.commit()
    
    flash('Report deleted successfully', 'success')
    return redirect(url_for('monitoring_reports_scheduled'))
    
@app.route('/monitoring/reports/history', methods=['GET'])
def monitoring_reports_history():
    """Report execution history page"""
    from models import ReportExecutionLog
    from datetime import datetime, timedelta
    
    # Get query parameters
    days = request.args.get('days', default=30, type=int)
    report_type = request.args.get('report_type', default=None)
    status = request.args.get('status', default=None)
    
    # Build query
    query = ReportExecutionLog.query
    
    # Apply filters
    if days > 0:
        cutoff_date = datetime.now() - timedelta(days=days)
        query = query.filter(ReportExecutionLog.execution_time >= cutoff_date)
        
    if report_type:
        query = query.filter(ReportExecutionLog.report_type == report_type)
        
    if status:
        query = query.filter(ReportExecutionLog.status == status)
    
    # Execute query with sorting
    logs = query.order_by(ReportExecutionLog.execution_time.desc()).all()
    
    # Get unique values for filter dropdowns
    all_report_types = db.session.query(ReportExecutionLog.report_type).distinct().all()
    report_types = [rt[0] for rt in all_report_types if rt[0]]
    
    statuses = ['success', 'error']
    
    # Calculate success rate
    total_count = len(logs)
    success_count = sum(1 for log in logs if log.status == 'success')
    success_rate = (success_count / total_count * 100) if total_count > 0 else 0
    
    # Calculate average execution time for successful reports
    successful_logs = [log for log in logs if log.status == 'success']
    avg_execution_time = None
    if successful_logs:
        total_seconds = sum((log.completion_time - log.execution_time).total_seconds() for log in successful_logs if log.completion_time)
        avg_execution_time = total_seconds / len(successful_logs) if successful_logs else None
    
    return render_template(
        'monitoring_reports_history.html', 
        logs=logs,
        report_types=report_types,
        statuses=statuses,
        current_days=days,
        current_report_type=report_type,
        current_status=status,
        total_count=total_count,
        success_count=success_count,
        success_rate=success_rate,
        avg_execution_time=avg_execution_time
    )

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

# Zillow routes
@app.route('/zillow/market-data')
def zillow_market_data():
    """Zillow market data visualization page."""
    try:
        return render_template('zillow_market_data.html')
    except Exception as e:
        logger.exception(f"Error in zillow_market_data route: {str(e)}")
        flash(f"Error loading market data page: {str(e)}", "danger")
        return redirect(url_for('index'))

@app.route('/zillow/properties')
def zillow_properties():
    """Zillow property search and display page."""
    location = request.args.get('location', '')
    
    try:
        return render_template('zillow_properties.html', location=location)
    except Exception as e:
        logger.exception(f"Error in zillow_properties route: {str(e)}")
        flash(f"Error loading properties page: {str(e)}", "danger")
        return redirect(url_for('index'))

# Initialize database tables
with app.app_context():
    # Create tables
    db.create_all()
    
    # Import and start the ETL scheduler
    try:
        from etl.scheduler import start_scheduler
        logger.info("Starting ETL job scheduler")
        start_scheduler()
        logger.info("ETL job scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start ETL job scheduler: {str(e)}")

# Main entry point
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
