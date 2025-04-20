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
        
        # Generate random property details
        bedrooms = random.randint(1, 5)
        bathrooms = random.randint(1, 4)
        sqft = random.randint(800, 3500)
        
        # Create sample record
        record = {
            'report_id': f"SAMPLE-{100000 + i}",
            'address': f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Maple', 'Cedar', 'Pine'])} St",
            'city': random.choice(cities),
            'state': 'CA',
            'zip_code': f"{random.randint(90000, 97000)}",
            'property_type': random.choice(property_types),
            'status': random.choice(statuses),
            'list_price': price,
            'bedrooms': bedrooms,
            'bathrooms': bathrooms,
            'square_feet': sqft,
            'lot_size': round(random.uniform(0.1, 2.0), 2),
            'year_built': random.randint(1950, 2020),
            'listing_date': date_str,
            'days_on_market': random.randint(1, 120),
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
                report_id VARCHAR(50),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(2),
                zip_code VARCHAR(10),
                property_type VARCHAR(50),
                status VARCHAR(20),
                list_price NUMERIC,
                bedrooms INTEGER,
                bathrooms NUMERIC,
                square_feet INTEGER,
                lot_size NUMERIC,
                year_built INTEGER,
                listing_date DATE,
                days_on_market INTEGER,
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