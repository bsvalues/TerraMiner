from datetime import datetime
from app import db

class ActivityLog(db.Model):
    """Model for tracking activity in the application."""
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def __repr__(self):
        return f"<ActivityLog {self.action}>"

class JobRun(db.Model):
    """Model for tracking scraper job runs."""
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, default=datetime.now)
    end_time = db.Column(db.DateTime)
    status = db.Column(db.String(20))  # 'running', 'completed', 'failed'
    error = db.Column(db.Text)
    items_processed = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def __repr__(self):
        return f"<JobRun {self.id} - {self.status}>"

class NarrprCredential(db.Model):
    """Model for storing NARRPR credentials."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<NarrprCredential {self.username}>"