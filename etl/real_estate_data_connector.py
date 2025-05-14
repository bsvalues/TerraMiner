"""
Real Estate Data Connector Module.

This module provides a unified interface for accessing real estate data
from multiple sources with intelligent failover capabilities.
"""

import logging
import time
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

from etl.base_api_connector import BaseApiConnector
# Import functions instead of models to avoid circular imports
def standardize_property_data(data, source):
    """Standardize property data from different sources into a common format."""
    # Simple implementation to avoid circular imports
    if not data:
        return {}
    
    # Add source metadata
    result = data.copy() if isinstance(data, dict) else {}
    if 'metadata' not in result:
        result['metadata'] = {}
    result['metadata']['source'] = source
    
    return result

# Create a mock DataSourceStatus class to avoid circular imports
class DataSourceStatus:
    """Mock DataSourceStatus class."""
    
    def __init__(self, **kwargs):
        self.source_name = kwargs.get('source_name', '')
        self.status = kwargs.get('status', 'unknown')
        self.is_active = kwargs.get('is_active', True)
        self.priority = kwargs.get('priority', 'secondary')
        self.success_rate = kwargs.get('success_rate', 100.0)
        self.avg_response_time = kwargs.get('avg_response_time', 0.0)
        self.error_count = kwargs.get('error_count', 0)
        self.request_count = kwargs.get('request_count', 0)
        self.last_check = kwargs.get('last_check', datetime.now())
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            'source_name': self.source_name,
            'status': self.status,
            'is_active': self.is_active,
            'priority': self.priority,
            'success_rate': self.success_rate,
            'avg_response_time': self.avg_response_time,
            'error_count': self.error_count,
            'request_count': self.request_count,
            'last_check': self.last_check
        }

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RealEstateDataConnector:
    """
    A unified connector for accessing real estate data from multiple sources
    with intelligent failover capabilities.
    
    This connector manages multiple data source connectors and attempts to retrieve
    data based on configured priorities, automatically falling back to alternative
    sources when a source fails or returns incomplete data.
    """
    
    def __init__(self):
        """Initialize the connector with available data sources."""
        self.connectors: Dict[str, BaseApiConnector] = {}
        self.priorities: Dict[str, int] = {}
        self.circuit_breakers: Dict[str, bool] = {}
        self.failover_timeout = 10  # seconds
        self.max_retry_attempts = 3
        
        # Default settings - override with load_settings()
        self.enable_circuit_breakers = True
        self.max_failures_before_circuit_break = 5
        self.circuit_reset_after = 3600  # seconds
        
        self._load_connectors()
    
    def _load_connectors(self):
        """Load available connectors and their configurations."""
        # This will be populated dynamically based on available connectors
        # For now, we'll hard-code the expected connectors
        self.expected_connectors = [
            'zillow',
            'realtor',
            'pacmls',
            'county'
        ]
        
        # Set default priorities (lower number = higher priority)
        self.priorities = {
            'zillow': 1,
            'realtor': 2,
            'pacmls': 3,
            'county': 4
        }
        
        # Initialize circuit breakers - all open by default
        self.circuit_breakers = {name: False for name in self.expected_connectors}
        
        # Load connectors (will be done dynamically)
        self._register_connector('zillow', None)
        self._register_connector('realtor', None)
        self._register_connector('pacmls', None)
        self._register_connector('county', None)
    
    def _register_connector(self, name: str, connector: Optional[BaseApiConnector]):
        """Register a connector with the system."""
        self.connectors[name] = connector
        if name not in self.priorities:
            # New connector, give it lowest priority
            self.priorities[name] = max(self.priorities.values()) + 1 if self.priorities else 1
        
        if name not in self.circuit_breakers:
            self.circuit_breakers[name] = False
        
        logger.info(f"Registered connector: {name} with priority {self.priorities[name]}")
    
    def load_settings(self):
        """Load connector settings from the database or configuration."""
        try:
            # This would typically load from database/config
            # For now, we'll use defaults
            from db import db
            settings = DataSourceStatus.query.all()
            
            # Update priorities based on settings
            for setting in settings:
                if setting.source_name in self.priorities:
                    # Convert priority string to number
                    if setting.priority == "primary":
                        self.priorities[setting.source_name] = 1
                    elif setting.priority == "secondary":
                        self.priorities[setting.source_name] = 2
                    elif setting.priority == "tertiary":
                        self.priorities[setting.source_name] = 3
                    elif setting.priority == "fallback":
                        self.priorities[setting.source_name] = 4
                    
                    # Update circuit breaker status
                    self.circuit_breakers[setting.source_name] = not setting.is_active
            
            # System settings
            system_settings = {
                'failover_timeout': 10,
                'max_retry_attempts': 3,
                'enable_circuit_breakers': True
            }
            
            self.failover_timeout = system_settings['failover_timeout']
            self.max_retry_attempts = system_settings['max_retry_attempts']
            self.enable_circuit_breakers = system_settings['enable_circuit_breakers']
            
            logger.info("Loaded connector settings successfully")
        except Exception as e:
            logger.error(f"Failed to load connector settings: {str(e)}")
    
    def get_property_details(self, property_id: str, source: Optional[str] = None) -> Dict[str, Any]:
        """
        Get detailed information about a specific property.
        
        Args:
            property_id: The identifier for the property
            source: Optional source to use, otherwise uses priority order
            
        Returns:
            Property details dictionary
        """
        if source:
            return self._get_from_specific_source('property_details', property_id, source)
        
        return self._get_with_failover('property_details', property_id)
    
    def search_properties(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Search for properties based on criteria.
        
        Args:
            query: Search criteria dictionary
            
        Returns:
            List of matching properties
        """
        return self._get_with_failover('property_search', query)
    
    def get_property_history(self, property_id: str) -> List[Dict[str, Any]]:
        """
        Get historical data for a property.
        
        Args:
            property_id: The identifier for the property
            
        Returns:
            List of historical events
        """
        return self._get_with_failover('property_history', property_id)
    
    def _get_from_specific_source(self, method: str, query: Any, source: str) -> Any:
        """
        Attempt to get data from a specific source.
        
        Args:
            method: The method to call on the connector
            query: The query or ID to pass to the method
            source: The specific source to use
            
        Returns:
            Data from the source, or empty if failed
        """
        if source not in self.connectors or self.connectors[source] is None:
            logger.warning(f"Source {source} not available")
            return {}
        
        if self.circuit_breakers.get(source, False) and self.enable_circuit_breakers:
            logger.warning(f"Circuit breaker open for {source}, skipping")
            return {}
        
        connector = self.connectors[source]
        
        try:
            if method == 'property_details':
                data = connector.get_property_details(query)
            elif method == 'property_search':
                data = connector.search_properties(query)
            elif method == 'property_history':
                data = connector.get_property_history(query)
            else:
                logger.error(f"Unknown method: {method}")
                return {}
            
            # Update metrics for successful call
            self._update_metrics(source, True, time.time())
            return data
        except Exception as e:
            logger.error(f"Error getting data from {source}: {str(e)}")
            # Update metrics for failed call
            self._update_metrics(source, False, time.time())
            return {}
    
    def _get_with_failover(self, method: str, query: Any) -> Any:
        """
        Try to get data using configured sources with failover.
        
        Args:
            method: The method to call on the connector
            query: The query or ID to pass to the method
            
        Returns:
            Data from the first successful source, or best effort from all sources
        """
        results = {}
        errors = {}
        sources_tried = []
        
        # Sort connectors by priority
        sorted_sources = sorted(
            [s for s in self.connectors if self.connectors[s] is not None],
            key=lambda s: self.priorities.get(s, 999)
        )
        
        # Try sources in priority order
        for source in sorted_sources:
            # Skip if circuit breaker is open
            if self.circuit_breakers.get(source, False) and self.enable_circuit_breakers:
                logger.info(f"Skipping {source} due to open circuit breaker")
                continue
                
            sources_tried.append(source)
            start_time = time.time()
            
            try:
                connector = self.connectors[source]
                retry_count = 0
                
                while retry_count <= self.max_retry_attempts:
                    try:
                        if method == 'property_details':
                            data = connector.get_property_details(query)
                        elif method == 'property_search':
                            data = connector.search_properties(query)
                        elif method == 'property_history':
                            data = connector.get_property_history(query)
                        else:
                            logger.error(f"Unknown method: {method}")
                            data = {}
                        
                        # Success - update metrics and return data
                        elapsed = time.time() - start_time
                        self._update_metrics(source, True, elapsed)
                        
                        # Standardize data format
                        if method == 'property_details' and data:
                            data = standardize_property_data(data, source)
                        
                        # If we got valid data, return it
                        if data and (isinstance(data, dict) and len(data) > 0) or (isinstance(data, list) and len(data) > 0):
                            return data
                        
                        # Otherwise try the next source
                        break
                    except Exception as e:
                        retry_count += 1
                        if retry_count <= self.max_retry_attempts:
                            logger.warning(f"Retry {retry_count} for {source}: {str(e)}")
                            time.sleep(1)  # Small delay between retries
                        else:
                            raise e
                
                # If we get here, the source returned empty results
                # Update metrics for "success" but no data
                elapsed = time.time() - start_time
                self._update_metrics(source, True, elapsed)
                
            except Exception as e:
                # Source failed completely
                elapsed = time.time() - start_time
                self._update_metrics(source, False, elapsed)
                errors[source] = str(e)
                logger.error(f"Error using {source}: {str(e)}")
                
                # Wait before trying next source
                time.sleep(min(self.failover_timeout, 2))
        
        logger.warning(f"All sources failed or returned empty for {method}. Sources tried: {sources_tried}")
        
        # If we get here, all sources failed or returned empty
        return {}
    
    def _update_metrics(self, source: str, success: bool, elapsed_time: float):
        """
        Update metrics for a source.
        
        Args:
            source: The source name
            success: Whether the call was successful
            elapsed_time: Time taken for the call
        """
        try:
            # Check if we have this source in our local tracking
            if source not in self.source_status:
                # Initialize a new status object
                self.source_status[source] = DataSourceStatus(
                    source_name=source,
                    status="unknown",
                    is_active=True,
                    request_count=0,
                    error_count=0,
                    success_rate=100.0,
                    avg_response_time=0.0
                )
            
            # Get the status object for this source
            status = self.source_status[source]
            
            # Update basic stats
            status.request_count += 1
            if not success:
                status.error_count += 1
            
            # Calculate success rate (avoid division by zero)
            if status.request_count > 0:
                status.success_rate = ((status.request_count - status.error_count) / status.request_count) * 100
            
            # Update avg response time with smoothing
            if status.avg_response_time == 0:
                status.avg_response_time = elapsed_time
            else:
                status.avg_response_time = (status.avg_response_time * 0.9) + (elapsed_time * 0.1)
            
            # Update status
            if status.success_rate >= 90:
                status.status = "healthy"
            elif status.success_rate >= 70:
                status.status = "degraded"
            elif status.success_rate >= 50:
                status.status = "limited"
            else:
                status.status = "critical"
            
            # Circuit breaker logic
            if self.enable_circuit_breakers:
                if not success and status.error_count > self.max_failures_before_circuit_break:
                    self.circuit_breakers[source] = True
                    status.is_active = False
                    logger.warning(f"Circuit breaker opened for {source}")
            
            status.last_check = datetime.now()
            
            # Note: We no longer update the DB here to avoid circular imports
            # DB updates will happen in a separate method that can be called periodically
            
        except Exception as e:
            logger.error(f"Failed to update metrics for {source}: {str(e)}")
    
    def test_source(self, source: str) -> Dict[str, Any]:
        """
        Test a specific data source connection.
        
        Args:
            source: The source name to test
            
        Returns:
            Test result with status and metrics
        """
        if source not in self.connectors or self.connectors[source] is None:
            return {
                "status": "unavailable",
                "message": f"Source {source} not available",
                "success": False
            }
        
        connector = self.connectors[source]
        
        try:
            start_time = time.time()
            # Use a simple test query that should work across all connectors
            test_query = {"location": "test", "limit": 1}
            result = connector.test_connection()
            elapsed = time.time() - start_time
            
            # Update metrics for success
            self._update_metrics(source, True, elapsed)
            
            # If source was circuit-broken, reset it
            if self.circuit_breakers.get(source, False):
                self.circuit_breakers[source] = False
                
                try:
                    from db import db
                    status = DataSourceStatus.query.filter_by(source_name=source).first()
                    if status:
                        status.is_active = True
                        db.session.commit()
                except Exception as e:
                    logger.error(f"Failed to reset circuit breaker for {source}: {str(e)}")
            
            return {
                "status": "connected",
                "message": f"Successfully connected to {source}",
                "response_time": round(elapsed, 3),
                "success": True
            }
        except Exception as e:
            elapsed = time.time() - start_time
            # Update metrics for failure
            self._update_metrics(source, False, elapsed)
            
            return {
                "status": "error",
                "message": str(e),
                "response_time": round(elapsed, 3),
                "success": False
            }
    
    def get_sources_status(self) -> List[Dict[str, Any]]:
        """
        Get status for all sources.
        
        Returns:
            List of source status dictionaries
        """
        status_list = []
        
        try:
            from db import db
            db_statuses = DataSourceStatus.query.all()
            
            for status in db_statuses:
                src_status = status.to_dict()
                src_status["circuit_open"] = self.circuit_breakers.get(status.source_name, False)
                src_status["priority"] = self.priorities.get(status.source_name, 999)
                status_list.append(src_status)
                
        except Exception as e:
            logger.error(f"Failed to get source statuses: {str(e)}")
            
            # Fall back to basic status
            for source, connector in self.connectors.items():
                available = connector is not None
                circuit_open = self.circuit_breakers.get(source, False)
                
                status_list.append({
                    "source_name": source,
                    "status": "unknown",
                    "is_active": available and not circuit_open,
                    "priority": self.priorities.get(source, 999),
                    "success_rate": 0,
                    "avg_response_time": 0,
                    "circuit_open": circuit_open,
                    "request_count": 0,
                    "error_count": 0
                })
                
        return sorted(status_list, key=lambda x: x["priority"])
    
    def update_source_priority(self, priorities: Dict[str, int]) -> bool:
        """
        Update source priorities.
        
        Args:
            priorities: Dictionary mapping source names to priority values
            
        Returns:
            Whether the update was successful
        """
        try:
            for source, priority in priorities.items():
                if source in self.connectors:
                    self.priorities[source] = priority
                    
                    # Update in database too
                    try:
                        from db import db
                        status = DataSourceStatus.query.filter_by(source_name=source).first()
                        if status:
                            if priority == 1:
                                status.priority = "primary"
                            elif priority == 2:
                                status.priority = "secondary"
                            elif priority == 3:
                                status.priority = "tertiary"
                            else:
                                status.priority = "fallback"
                            db.session.commit()
                    except Exception as e:
                        logger.error(f"Failed to update priority in database: {str(e)}")
            
            return True
        except Exception as e:
            logger.error(f"Failed to update source priorities: {str(e)}")
            return False
    
    def update_source_status(self, source: str, is_active: bool) -> bool:
        """
        Update source active status.
        
        Args:
            source: Source name
            is_active: Whether the source should be active
            
        Returns:
            Whether the update was successful
        """
        try:
            # Update circuit breaker
            self.circuit_breakers[source] = not is_active
            
            # Update in database
            try:
                from db import db
                status = DataSourceStatus.query.filter_by(source_name=source).first()
                if status:
                    status.is_active = is_active
                    db.session.commit()
            except Exception as e:
                logger.error(f"Failed to update source status in database: {str(e)}")
            
            return True
        except Exception as e:
            logger.error(f"Failed to update source status: {str(e)}")
            return False
    
    def update_system_settings(self, settings: Dict[str, Any]) -> bool:
        """
        Update system-wide settings.
        
        Args:
            settings: Dictionary of settings to update
            
        Returns:
            Whether the update was successful
        """
        try:
            if 'failover_timeout' in settings:
                self.failover_timeout = settings['failover_timeout']
            
            if 'max_retry_attempts' in settings:
                self.max_retry_attempts = settings['max_retry_attempts']
            
            if 'enable_circuit_breakers' in settings:
                self.enable_circuit_breakers = settings['enable_circuit_breakers']
                
                # If disabling circuit breakers, reset all circuit breakers
                if not self.enable_circuit_breakers:
                    for source in self.circuit_breakers:
                        self.circuit_breakers[source] = False
            
            return True
        except Exception as e:
            logger.error(f"Failed to update system settings: {str(e)}")
            return False