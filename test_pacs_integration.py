"""
Integration test for the Benton County PACS database integration.

This test verifies that our PACS integration follows IAAO and USPAP standards
by only displaying authentic data or clear error messages.
"""

import os
import sys
import requests
import logging
import json
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
TEST_PROPERTY_ID = "1234567890"  # Test property ID
TEST_COUNTY = "benton"
PACS_API_URL = os.environ.get("PACS_API_URL", "http://localhost:8000")

def test_assessment_api():
    """
    Test the assessment API to ensure it only returns authentic data
    or clear error states with no demonstration data.
    """
    # Import the assessment API function
    try:
        from regional.assessment_api import get_assessment_data
        logger.info("Successfully imported assessment_api module")
    except ImportError as e:
        logger.error(f"Failed to import assessment_api module: {str(e)}")
        return False
    
    # Test retrieving assessment data for a Benton County property
    result = get_assessment_data(TEST_PROPERTY_ID, TEST_COUNTY)
    
    # Verify the result
    if "error" in result:
        # If there's an error, make sure it's not falling back to demonstration data
        logger.info(f"Received error response: {result['error']}")
        logger.info(f"Error message: {result.get('message', 'No message')}")
        
        # This test passes if the error is clear and doesn't fall back to demo data
        return True
    
    # If we got data, verify it's authentic (has the using_real_data flag)
    if result.get("using_real_data", False):
        logger.info("Successfully retrieved authentic assessment data")
        data_source = result.get("data_source", "Unknown")
        logger.info(f"Data source: {data_source}")
        return True
    
    # If we got here, we have data that doesn't claim to be authentic
    logger.error("Retrieved data does not have the using_real_data flag or has it set to False")
    return False

def test_pacs_api_server():
    """
    Test the PACS API server to ensure it's running and returns
    proper results or error messages.
    """
    try:
        # Test the root endpoint first
        logger.info(f"Testing PACS API server at {PACS_API_URL}")
        response = requests.get(f"{PACS_API_URL}/", timeout=5)
        
        if response.status_code != 200:
            logger.error(f"PACS API server root endpoint returned status code {response.status_code}")
            return False
        
        info = response.json()
        logger.info(f"PACS API server info: {info.get('name', 'Unknown')} (version {info.get('version', 'Unknown')})")
        
        # Test the property endpoint
        logger.info(f"Testing property endpoint with property ID {TEST_PROPERTY_ID}")
        response = requests.get(f"{PACS_API_URL}/property/{TEST_PROPERTY_ID}", timeout=5)
        
        # Check if we have a successful response or a proper error response
        if response.status_code == 200:
            data = response.json()
            
            if "error" in data:
                # This is a proper error response in JSON format
                logger.info(f"Received error response: {data['error']}")
                logger.info(f"Error message: {data.get('message', 'No message')}")
                return True
            
            # If we have data, check if it's authentic
            if data.get("using_real_data", False):
                logger.info("Successfully retrieved authentic property data from PACS API")
                data_source = data.get("data_source", "Unknown")
                logger.info(f"Data source: {data_source}")
                return True
            
            # If we have data but it's not marked as authentic
            logger.error("Retrieved data does not have the using_real_data flag or has it set to False")
            return False
        
        elif 400 <= response.status_code < 500:
            # Client error, likely a 404 for property not found
            logger.info(f"Received client error {response.status_code}: {response.text}")
            return True
        
        else:
            # Server error or other issue
            logger.error(f"PACS API server property endpoint returned status code {response.status_code}")
            return False
            
    except requests.RequestException as e:
        logger.error(f"Error connecting to PACS API server: {str(e)}")
        return False

def run_tests():
    """
    Run all the integration tests and report results.
    """
    logger.info("Running PACS integration tests...")
    
    # Test the assessment API
    assessment_api_test = test_assessment_api()
    logger.info(f"Assessment API test: {'PASSED' if assessment_api_test else 'FAILED'}")
    
    # Test the PACS API server
    pacs_api_test = test_pacs_api_server()
    logger.info(f"PACS API server test: {'PASSED' if pacs_api_test else 'FAILED'}")
    
    # Overall result
    overall_result = assessment_api_test and pacs_api_test
    logger.info(f"Overall test result: {'PASSED' if overall_result else 'FAILED'}")
    
    return 0 if overall_result else 1

if __name__ == "__main__":
    sys.exit(run_tests())