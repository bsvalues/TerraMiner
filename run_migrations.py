"""
Script to run database migrations and create necessary tables.
"""
import logging
import os
from flask import Flask
from core import db
from db.migrations import run_migrations as run_db_migrations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migrations():
    """Run migrations to create or update database tables."""
    try:
        logger.info("Starting database migrations...")
        
        # Create a minimal app for migration purposes
        app = Flask(__name__)
        app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
        app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
            "pool_recycle": 300,
            "pool_pre_ping": True,
        }
        app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        
        # Initialize the database with the app
        db.init_app(app)
        
        with app.app_context():
            # Create tables that don't exist
            db.create_all()
            logger.info("Database tables created successfully")
            
            # Run additional migrations (indexes, etc.)
            run_db_migrations()
            logger.info("Performance optimizations completed")

    except Exception as e:
        logger.error(f"Error during migration: {str(e)}")
        raise

if __name__ == "__main__":
    run_migrations()