import os
import sys
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the current directory to the path to ensure imports work correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import core components first
from core import run_etl_workflow

# Import the app directly now that we've fixed the circular imports
try:
    from app import app
    logger.info("Successfully imported app")
except Exception as e:
    logger.error(f"Failed to import app: {str(e)}")
    raise
from etl.narrpr_scraper import NarrprScraper
from etl.zillow_scraper import ZillowScraper
from etl.manager import etl_manager
from db.database import save_to_database
from utils.logger import setup_logger
from utils.config import load_config
from utils.api_monitoring import setup_monitoring
from utils.system_monitor import start_monitoring
from ai.api.prompt_endpoints import register_endpoints as register_prompt_endpoints
from ai.api.learning_endpoints import register_endpoints as register_learning_endpoints
from ai.api.integration_endpoints import register_endpoints as register_integration_endpoints
from ai.api.monitoring_endpoints import register_endpoints as register_monitoring_endpoints
from controllers.property_record_controller import register_blueprint as register_property_record_bp

# Register AI endpoints
register_prompt_endpoints(app)
register_learning_endpoints(app)
register_integration_endpoints(app)
register_monitoring_endpoints(app)

# Register property record controller
try:
    register_property_record_bp(app)
    logger.info("Registered Property Record Card blueprint")
except Exception as e:
    logger.error(f"Failed to register Property Record Card blueprint: {str(e)}")

# Setup API monitoring
setup_monitoring(app)

# Start system monitoring (collect metrics every 5 minutes)
with app.app_context():
    start_monitoring(interval=300)

# Set up logging
setup_logger()
logger = logging.getLogger(__name__)

# The ETL workflow is now imported from core.py to avoid circular dependencies

# Run with Flask app if executed directly
if __name__ == "__main__":
    with app.app_context():
        run_etl_workflow()
