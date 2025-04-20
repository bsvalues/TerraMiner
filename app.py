import os
import logging
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from etl.narrpr_scraper import NarrprScraper
from db.database import save_to_database, Database
from utils.logger import setup_logger
from utils.config import load_config, update_config

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
    
    return render_template('reports.html', reports=reports_data)

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

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error_code=404, error_message="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', error_code=500, error_message="Internal server error"), 500

# Import models
from models import ActivityLog, JobRun, NarrprCredential

# Initialize database tables
with app.app_context():
    # Create tables
    db.create_all()

# Main entry point
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
