"""
Script to run database migrations and create necessary tables.
"""
import logging
from app import app, db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migrations():
    """Run migrations to create or update database tables."""
    try:
        logger.info("Starting database migrations...")
        with app.app_context():
            # Create tables that don't exist
            db.create_all()
            logger.info("Database tables created successfully")

    except Exception as e:
        logger.error(f"Error during migration: {str(e)}")
        raise

if __name__ == "__main__":
    run_migrations()