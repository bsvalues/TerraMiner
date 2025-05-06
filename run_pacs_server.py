"""
Script to run the PACS API server as a standalone service.
"""

import uvicorn
import dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
dotenv.load_dotenv()

def main():
    """Start the PACS API server."""
    logger.info("Starting PACS API Server")
    
    # Get port from environment variable or use default 8000
    port = int(os.environ.get("PACS_API_PORT", 8000))
    
    # Log the environment configuration
    logger.info(f"PACS_SERVER: {os.environ.get('PACS_SERVER', 'jcharrispacs')}")
    logger.info(f"PACS_DATABASE: {os.environ.get('PACS_DATABASE', 'pacs_training')}")
    logger.info(f"PACS API Server listening on port {port}")
    
    # Start the FastAPI server
    uvicorn.run("pacs_api_server:app", host="0.0.0.0", port=port)

if __name__ == "__main__":
    main()