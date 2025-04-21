import logging
import random
from datetime import datetime, timedelta
from db.database import Database

logger = logging.getLogger(__name__)

def generate_sample_property_data(num_records=20):
    """
    Generate sample property data for testing purposes.
    
    Args:
        num_records (int): Number of sample records to generate
        
    Returns:
        list: List of dictionaries containing sample property data
    """
    property_types = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Vacant Land']
    statuses = ['Active', 'Pending', 'Sold', 'Off Market', 'Coming Soon']
    cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 
              'San Antonio', 'San Diego', 'Dallas', 'San Jose']
    
    sample_data = []
    
    for i in range(num_records):
        # Generate random date within last 30 days
        days_ago = random.randint(0, 30)
        date = datetime.now() - timedelta(days=days_ago)
        date_str = date.strftime("%Y-%m-%d")
        
        # Generate random price
        price = random.randint(200000, 1500000)
        price_str = f"${price:,}"
        
        # Generate title from property type and address
        property_type = random.choice(property_types)
        street_name = random.choice(['Main', 'Oak', 'Maple', 'Cedar', 'Pine'])
        street_number = random.randint(100, 9999)
        address = f"{street_number} {street_name} St, {random.choice(cities)}, CA"
        title = f"{property_type} Property - {street_name} St"
        
        # Create sample record
        record = {
            'title': title,
            'date': date_str,
            'address': address,
            'price': price_str,
            'created_at': datetime.now().isoformat()
        }
        
        sample_data.append(record)
    
    return sample_data

def insert_test_data():
    """
    Insert test data into the database.
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Generate sample data
        sample_data = generate_sample_property_data(20)
        
        # Create database connection
        db = Database()
        
        # First check if the table exists
        check_query = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'narrpr_reports'
        );
        """
        
        result = db.execute_query(check_query)
        table_exists = result[0]['exists'] if result else False
        
        # Create table if it doesn't exist
        if not table_exists:
            create_table_query = """
            CREATE TABLE IF NOT EXISTS narrpr_reports (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255),
                date VARCHAR(50),
                address VARCHAR(255),
                price VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            db.execute_query(create_table_query)
            logger.info("Created narrpr_reports table")
        
        # Insert sample data
        for record in sample_data:
            cols = ", ".join(record.keys())
            vals = ", ".join([f"'{v}'" if isinstance(v, str) else str(v) for v in record.values()])
            
            insert_query = f"""
            INSERT INTO narrpr_reports ({cols})
            VALUES ({vals})
            """
            
            db.execute_query(insert_query)
        
        logger.info(f"Inserted {len(sample_data)} sample records into narrpr_reports table")
        
        # Close database connection
        db.close()
        
        return True
        
    except Exception as e:
        logger.error(f"Error inserting test data: {str(e)}")
        return False

if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(level=logging.INFO)
    
    # Insert test data
    insert_test_data()