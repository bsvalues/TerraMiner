"""
Script to fix the scheduled_report table schema by adding the is_active column.
"""
import logging
import os
from sqlalchemy import create_engine, text

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_scheduled_report_table():
    """Fix the scheduled_report table structure to match the model."""
    try:
        # Get database connection string from environment
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            logger.error("DATABASE_URL environment variable not set")
            return False
        
        # Create engine
        engine = create_engine(database_url)
        
        # Check if scheduled_report table exists
        with engine.connect() as conn:
            logger.info("Checking if scheduled_report table exists...")
            result = conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scheduled_report')"
            ))
            exists = result.scalar()
            
            if not exists:
                logger.error("scheduled_report table does not exist")
                return False
            
            # Check if is_active column exists
            logger.info("Checking if is_active column exists...")
            result = conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scheduled_report' AND column_name = 'is_active')"
            ))
            column_exists = result.scalar()
            
            if column_exists:
                logger.info("is_active column already exists")
                return True
            
            # Add is_active column
            logger.info("Adding is_active column to scheduled_report table...")
            conn.execute(text(
                "ALTER TABLE scheduled_report ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE"
            ))
            conn.commit()
            logger.info("Successfully added is_active column")
            
            return True
            
    except Exception as e:
        logger.error(f"Error fixing scheduled_report table: {str(e)}")
        return False

if __name__ == "__main__":
    success = fix_scheduled_report_table()
    if success:
        print("Successfully fixed scheduled_report table")
    else:
        print("Failed to fix scheduled_report table")