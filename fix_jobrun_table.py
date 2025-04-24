"""
Script to fix the job_run table schema.
"""
import logging
import os
from sqlalchemy import create_engine, text

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_job_run_table():
    """Fix the job_run table structure to match the model."""
    try:
        # Get database connection string from environment
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            logger.error("DATABASE_URL environment variable not set")
            return False
        
        # Create engine
        engine = create_engine(database_url)
        success = False
        
        # Check if job_run table exists
        with engine.connect() as conn:
            logger.info("Checking if job_run table exists...")
            result = conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_run')"
            ))
            exists = result.scalar()
            
            if not exists:
                logger.error("job_run table does not exist")
                return False
            
            # Add missing columns to job_run table
            columns_to_check = [
                ("job_name", "VARCHAR(100) NOT NULL DEFAULT 'unknown'"),
                ("runtime_seconds", "FLOAT"),
                ("error_message", "TEXT"),
                ("result_summary", "TEXT"),
                ("created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
            ]
            
            for column_name, column_type in columns_to_check:
                # Check if column exists
                logger.info(f"Checking if {column_name} column exists...")
                result = conn.execute(text(
                    f"SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_run' AND column_name = '{column_name}')"
                ))
                column_exists = result.scalar()
                
                if not column_exists:
                    # Add column
                    logger.info(f"Adding {column_name} column to job_run table...")
                    conn.execute(text(
                        f"ALTER TABLE job_run ADD COLUMN {column_name} {column_type}"
                    ))
                    conn.commit()
                    logger.info(f"Successfully added {column_name} column")
                    success = True
                else:
                    logger.info(f"{column_name} column already exists")
            
            # If no changes were made, still consider it a success
            if not success:
                logger.info("No changes needed to job_run table")
            
            return True
            
    except Exception as e:
        logger.error(f"Error fixing job_run table: {str(e)}")
        return False

if __name__ == "__main__":
    success = fix_job_run_table()
    if success:
        print("Successfully fixed job_run table")
    else:
        print("Failed to fix job_run table")