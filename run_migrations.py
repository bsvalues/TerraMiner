#!/usr/bin/env python
"""
Script to run database migrations.
"""
import sys
import logging
from app import app
from db.migrations import run_all_migrations

# Setup logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def main():
    """
    Main function to run database migrations.
    """
    logger.info("Starting database migrations...")
    
    with app.app_context():
        results = run_all_migrations()
        
        # Check if all migrations were successful
        all_successful = all(results.values())
        
        if all_successful:
            logger.info("All migrations completed successfully!")
        else:
            logger.error("Some migrations failed:")
            for table, success in results.items():
                if not success:
                    logger.error(f"  - {table}")
            sys.exit(1)
    
    logger.info("Migrations completed.")

if __name__ == "__main__":
    main()