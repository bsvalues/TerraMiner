"""
Database migration utilities to update database schema without losing data.
"""
import logging
import traceback
from sqlalchemy import text
from app import db

logger = logging.getLogger(__name__)

def safe_execute_sql(sql, params=None):
    """
    Safely execute SQL with proper error handling and transaction management.
    
    Args:
        sql (str): SQL statement to execute
        params (dict, optional): Parameters for the SQL statement
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        with db.engine.connect() as connection:
            with connection.begin():
                if params:
                    connection.execute(text(sql), params)
                else:
                    connection.execute(text(sql))
        return True
    except Exception as e:
        logger.error(f"Error executing SQL: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def column_exists(table_name, column_name):
    """
    Check if a column exists in a table.
    
    Args:
        table_name (str): Table name
        column_name (str): Column name
        
    Returns:
        bool: True if the column exists, False otherwise
    """
    try:
        sql = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = :table_name 
        AND column_name = :column_name
        """
        with db.engine.connect() as connection:
            result = connection.execute(
                text(sql), 
                {"table_name": table_name, "column_name": column_name}
            ).fetchone()
        return result is not None
    except Exception as e:
        logger.error(f"Error checking if column exists: {str(e)}")
        return False

def table_exists(table_name):
    """
    Check if a table exists in the database.
    
    Args:
        table_name (str): Table name
        
    Returns:
        bool: True if the table exists, False otherwise
    """
    try:
        sql = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = :table_name
        """
        with db.engine.connect() as connection:
            result = connection.execute(
                text(sql), 
                {"table_name": table_name}
            ).fetchone()
        return result is not None
    except Exception as e:
        logger.error(f"Error checking if table exists: {str(e)}")
        return False

def add_column(table_name, column_name, column_type, nullable=True, default=None):
    """
    Add a column to a table if it doesn't exist.
    
    Args:
        table_name (str): Table name
        column_name (str): Column name
        column_type (str): Column type (e.g., 'INTEGER', 'TEXT', 'BOOLEAN', etc.)
        nullable (bool, optional): Whether the column is nullable
        default (str, optional): Default value for the column
        
    Returns:
        bool: True if successful, False otherwise
    """
    # Check if column already exists
    if column_exists(table_name, column_name):
        logger.info(f"Column {column_name} already exists in table {table_name}")
        return True
        
    # Build SQL
    sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
    
    if not nullable:
        sql += " NOT NULL"
        
    if default is not None:
        sql += f" DEFAULT {default}"
        
    # Execute SQL
    logger.info(f"Adding column {column_name} to table {table_name}")
    return safe_execute_sql(sql)

def create_table_if_not_exists(table_name, columns):
    """
    Create a table if it doesn't exist.
    
    Args:
        table_name (str): Table name
        columns (list): List of column definitions as strings
        
    Returns:
        bool: True if successful, False otherwise
    """
    # Check if table already exists
    if table_exists(table_name):
        logger.info(f"Table {table_name} already exists")
        return True
        
    # Build SQL
    column_defs = ", ".join(columns)
    sql = f"CREATE TABLE {table_name} ({column_defs})"
    
    # Execute SQL
    logger.info(f"Creating table {table_name}")
    return safe_execute_sql(sql)

def migrate_monitoring_alert_table():
    """
    Migrate the monitoring_alert table to add new columns.
    
    Returns:
        bool: True if successful, False otherwise
    """
    success = True
    
    # Add alert_rule_id column
    if not column_exists("monitoring_alert", "alert_rule_id"):
        success = success and add_column(
            "monitoring_alert", 
            "alert_rule_id", 
            "INTEGER", 
            nullable=True
        )
    
    # Add notifications_sent column
    if not column_exists("monitoring_alert", "notifications_sent"):
        success = success and add_column(
            "monitoring_alert", 
            "notifications_sent", 
            "BOOLEAN", 
            nullable=False, 
            default="false"
        )
    
    # Add notification_sent_at column
    if not column_exists("monitoring_alert", "notification_sent_at"):
        success = success and add_column(
            "monitoring_alert", 
            "notification_sent_at", 
            "TIMESTAMP", 
            nullable=True
        )
    
    return success

def create_notification_channel_table():
    """
    Create the notification_channel table if it doesn't exist.
    
    Returns:
        bool: True if successful, False otherwise
    """
    columns = [
        "id SERIAL PRIMARY KEY",
        "name VARCHAR(100) NOT NULL",
        "channel_type VARCHAR(20) NOT NULL",
        "config TEXT NOT NULL",
        "is_active BOOLEAN NOT NULL DEFAULT true",
        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
    ]
    
    return create_table_if_not_exists("notification_channel", columns)

def create_alert_rule_table():
    """
    Create the alert_rule table if it doesn't exist.
    
    Returns:
        bool: True if successful, False otherwise
    """
    columns = [
        "id SERIAL PRIMARY KEY",
        "name VARCHAR(100) NOT NULL",
        "description TEXT",
        "alert_type VARCHAR(50) NOT NULL",
        "severity VARCHAR(20) NOT NULL",
        "condition_type VARCHAR(50) NOT NULL",
        "condition_config TEXT NOT NULL",
        "component VARCHAR(50) NOT NULL",
        "is_active BOOLEAN NOT NULL DEFAULT true",
        "cooldown_minutes INTEGER NOT NULL DEFAULT 60",
        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
    ]
    
    return create_table_if_not_exists("alert_rule", columns)

def create_alert_notification_map_table():
    """
    Create the alert_notification_map table if it doesn't exist.
    
    Returns:
        bool: True if successful, False otherwise
    """
    columns = [
        "id SERIAL PRIMARY KEY",
        "alert_type VARCHAR(50) NOT NULL",
        "min_severity VARCHAR(20) NOT NULL",
        "channel_id INTEGER NOT NULL",
        "is_active BOOLEAN NOT NULL DEFAULT true",
        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "FOREIGN KEY (channel_id) REFERENCES notification_channel (id)"
    ]
    
    return create_table_if_not_exists("alert_notification_map", columns)

def run_all_migrations():
    """
    Run all database migrations.
    
    Returns:
        dict: Migration results
    """
    results = {}
    
    # Migrate monitoring_alert table
    results["monitoring_alert"] = migrate_monitoring_alert_table()
    
    # Create new tables
    results["notification_channel"] = create_notification_channel_table()
    results["alert_rule"] = create_alert_rule_table()
    results["alert_notification_map"] = create_alert_notification_map_table()
    
    # Log results
    for table, success in results.items():
        if success:
            logger.info(f"Migration for {table} completed successfully")
        else:
            logger.error(f"Migration for {table} failed")
    
    # Return overall success
    return results