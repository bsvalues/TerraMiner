"""
Test script to verify connection to the Benton County PACS database
"""

import os
import sys
import pyodbc
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_connection():
    """
    Test connection to the PACS database
    """
    # Get connection parameters from environment variables or use defaults
    server = os.environ.get('PACS_SERVER', 'jcharrispacs')
    database = os.environ.get('PACS_DATABASE', 'pacs_training')
    
    # Build connection string using Windows integrated authentication
    conn_str = (
        'DRIVER={ODBC Driver 17 for SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
    )
    
    logger.info(f"Attempting to connect to PACS database: {server}/{database}")
    
    try:
        # Try to connect to the database
        connection = pyodbc.connect(conn_str)
        logger.info("Connection successful!")
        
        # Test a simple query to verify database access
        cursor = connection.cursor()
        cursor.execute("SELECT @@VERSION")
        row = cursor.fetchone()
        
        if row:
            logger.info(f"SQL Server version: {row[0]}")
        
        # List tables in the database
        logger.info("Listing tables in the database:")
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        """)
        
        tables = cursor.fetchall()
        for table in tables:
            logger.info(f"  - {table[0]}")
        
        # Close connection
        connection.close()
        logger.info("Connection closed.")
        return True
        
    except Exception as e:
        logger.error(f"Connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("PACS Database Connection Test")
    
    # Run the connection test
    success = test_connection()
    
    # Exit with appropriate status code
    if success:
        logger.info("Test completed successfully.")
        sys.exit(0)
    else:
        logger.error("Test failed.")
        sys.exit(1)