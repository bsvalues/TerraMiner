# Import models from specific modules
from models.zillow_data import ZillowMarketData, ZillowPriceTrend, ZillowProperty

# Import directly from main models module
from app import db
# Next, import all the models directly here to avoid circular dependencies
from datetime import datetime
from datetime import date

class SystemMetric(db.Model):
    """Model for storing system performance metrics."""
    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(100), nullable=False)  # Name of the metric
    metric_value = db.Column(db.Float, nullable=False)  # Numerical value
    metric_unit = db.Column(db.String(50), nullable=True)  # Unit of measurement
    category = db.Column(db.String(50), nullable=False)  # Category (performance, usage, etc.)
    component = db.Column(db.String(50), nullable=False)  # Component (database, api, ai, etc.)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.now)  # When the metric was recorded
    
    def __repr__(self):
        return f"<SystemMetric id={self.id} name={self.metric_name} value={self.metric_value} component={self.component}>"

class APIUsageLog(db.Model):
    """Model for tracking API usage."""
    id = db.Column(db.Integer, primary_key=True)
    endpoint = db.Column(db.String(255), nullable=False)  # API endpoint
    method = db.Column(db.String(10), nullable=False)  # HTTP method
    status_code = db.Column(db.Integer, nullable=False)  # HTTP status code
    response_time = db.Column(db.Float, nullable=False)  # Response time in seconds
    user_agent = db.Column(db.String(255), nullable=True)  # User agent
    ip_address = db.Column(db.String(50), nullable=True)  # IP address
    request_payload = db.Column(db.Text, nullable=True)  # Request payload
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.now)  # When the request was made
    
    def __repr__(self):
        return f"<APIUsageLog id={self.id} endpoint={self.endpoint} status={self.status_code}>"

class AIAgentMetrics(db.Model):
    """Model for tracking AI agent performance metrics."""
    id = db.Column(db.Integer, primary_key=True)
    agent_type = db.Column(db.String(50), nullable=False)  # Type of agent
    prompt_version_id = db.Column(db.Integer, nullable=True)  # Related prompt version
    request_count = db.Column(db.Integer, default=0)  # Number of requests
    average_response_time = db.Column(db.Float, default=0.0)  # Average response time in seconds
    average_rating = db.Column(db.Float, default=0.0)  # Average rating (1-5)
    token_usage = db.Column(db.Integer, default=0)  # Total tokens used
    error_count = db.Column(db.Integer, default=0)  # Number of errors
    date = db.Column(db.Date, nullable=False)  # Date of metrics collection
    
    # Add aliases to match attributes used in the codebase
    @property
    def requests(self):
        return self.request_count
        
    @property
    def tokens_used(self):
        return self.token_usage
        
    @property
    def avg_response_time(self):
        return self.average_response_time
        
    @property
    def avg_rating(self):
        return self.average_rating
        
    @property
    def feedback_count(self):
        # This is a placeholder for backward compatibility
        # In practice this would need to be calculated from feedback table
        return 1 if self.average_rating > 0 else 0
    
    # Relationship code commented out to avoid circular references
    # prompt_version = db.relationship('PromptVersion', backref=db.backref('metrics', lazy=True))
    
    def __repr__(self):
        return f"<AIAgentMetrics id={self.id} agent={self.agent_type} date={self.date}>"

class MonitoringAlert(db.Model):
    """Model for system monitoring alerts."""
    id = db.Column(db.Integer, primary_key=True)
    alert_type = db.Column(db.String(50), nullable=False)  # Type of alert (threshold, anomaly, etc.)
    component = db.Column(db.String(50), nullable=False)  # Component (database, api, ai, etc.)
    severity = db.Column(db.String(20), nullable=False)  # Severity (info, warning, critical)
    status = db.Column(db.String(20), nullable=False, default='active')  # Status (active, acknowledged, resolved)
    message = db.Column(db.Text, nullable=False)  # Alert message
    details = db.Column(db.Text, nullable=True)  # Additional details
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)

class ScheduledReport(db.Model):
    """Model for scheduled monitoring reports."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    report_type = db.Column(db.String(50), nullable=False)
    config = db.Column(db.Text, nullable=False)  # JSON configuration
    schedule = db.Column(db.String(50), nullable=False)  # Cron expression
    format = db.Column(db.String(20), nullable=False, default='pdf')  # Format (pdf, csv, xlsx, html)
    recipients = db.Column(db.Text, nullable=True)  # JSON array of recipients
    last_run = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

class ReportExecution(db.Model):
    """Model for tracking report execution history."""
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('scheduled_report.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # Status (success, failure)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.now)
    end_time = db.Column(db.DateTime, nullable=True)
    output_file = db.Column(db.String(255), nullable=True)  # Path to the output file
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    
    # Relationship
    report = db.relationship('ScheduledReport', backref=db.backref('executions', lazy=True))

class PropertyLocation(db.Model):
    """Model for property location data."""
    id = db.Column(db.Integer, primary_key=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(50), nullable=True)
    zip_code = db.Column(db.String(20), nullable=True)
    property_type = db.Column(db.String(50), nullable=True)
    price = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), nullable=True)  # For sale, sold, etc.
    bedrooms = db.Column(db.Integer, nullable=True)
    bathrooms = db.Column(db.Float, nullable=True)
    square_feet = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

class PriceTrend(db.Model):
    """Model for price trend data."""
    id = db.Column(db.Integer, primary_key=True)
    region = db.Column(db.String(100), nullable=False)  # City, state, zip code, etc.
    region_type = db.Column(db.String(20), nullable=False)  # City, state, zip code, etc.
    period = db.Column(db.String(20), nullable=False)  # Month, quarter, year
    date = db.Column(db.Date, nullable=False)
    price = db.Column(db.Float, nullable=False)
    change_from_prev = db.Column(db.Float, nullable=True)  # Percentage change from previous period
    change_from_year_ago = db.Column(db.Float, nullable=True)  # Percentage change from same period last year
    source = db.Column(db.String(50), nullable=False, default='zillow')  # Data source

# Re-export all models so they can be imported from models directly
__all__ = [
    # Zillow models
    'ZillowMarketData', 'ZillowPriceTrend', 'ZillowProperty',
    
    # Monitoring models
    'SystemMetric', 'APIUsageLog', 'MonitoringAlert', 'ScheduledReport',
    'ReportExecution', 'AIAgentMetrics',
    
    # Geographical models
    'PropertyLocation', 'PriceTrend'
]