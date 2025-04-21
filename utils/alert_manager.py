"""
Alert management service for handling alert generation and notifications.
"""
import os
import json
import logging
from datetime import datetime, timedelta
import traceback

from app import db
from models import MonitoringAlert, NotificationChannel, AlertRule, AlertNotificationMap
from utils.notification_service import NotificationService

# Set up logging
logger = logging.getLogger(__name__)

class AlertManager:
    """Manager for handling alert creation, resolution, and notifications."""
    
    @staticmethod
    def create_alert(alert_type, severity, component, message, details=None, rule_id=None):
        """
        Create a new monitoring alert.
        
        Args:
            alert_type (str): Type of alert (error, warning, etc.)
            severity (str): Severity level (critical, error, warning, info)
            component (str): Component generating the alert
            message (str): Alert message
            details (str, optional): Additional details about the alert
            rule_id (int, optional): ID of the alert rule that triggered this alert
            
        Returns:
            MonitoringAlert: The created alert object
        """
        try:
            # Check if there's already an active alert with the same properties
            existing_alert = MonitoringAlert.query.filter_by(
                alert_type=alert_type,
                component=component,
                status='active'
            ).order_by(MonitoringAlert.created_at.desc()).first()
            
            # If there's an existing alert less than the cooldown period, don't create a new one
            if existing_alert:
                # If rule exists, check cooldown
                if rule_id:
                    rule = AlertRule.query.get(rule_id)
                    if rule:
                        cooldown = timedelta(minutes=rule.cooldown_minutes)
                        if existing_alert.created_at > datetime.now() - cooldown:
                            logger.info(f"Alert suppressed due to cooldown: {alert_type} - {message}")
                            return existing_alert
                elif existing_alert.created_at > datetime.now() - timedelta(minutes=60):  # Default 60 minute cooldown
                    logger.info(f"Alert suppressed due to default cooldown: {alert_type} - {message}")
                    return existing_alert
            
            # Create new alert
            alert = MonitoringAlert(
                alert_type=alert_type,
                severity=severity,
                component=component,
                message=message,
                details=details,
                alert_rule_id=rule_id,
                status='active'
            )
            
            db.session.add(alert)
            db.session.commit()
            
            logger.info(f"Created new alert: {alert_type} - {message}")
            
            # Send notifications
            AlertManager.send_alert_notifications(alert)
            
            return alert
            
        except Exception as e:
            logger.error(f"Error creating alert: {str(e)}")
            logger.error(traceback.format_exc())
            db.session.rollback()
            return None
    
    @staticmethod
    def acknowledge_alert(alert_id):
        """
        Acknowledge an alert.
        
        Args:
            alert_id (int): ID of the alert to acknowledge
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            alert = MonitoringAlert.query.get(alert_id)
            if not alert:
                logger.error(f"Alert not found: {alert_id}")
                return False
                
            if alert.status != 'active':
                logger.warning(f"Cannot acknowledge alert {alert_id} with status {alert.status}")
                return False
                
            alert.status = 'acknowledged'
            alert.acknowledged_at = datetime.now()
            db.session.commit()
            
            logger.info(f"Alert {alert_id} acknowledged")
            return True
            
        except Exception as e:
            logger.error(f"Error acknowledging alert: {str(e)}")
            db.session.rollback()
            return False
    
    @staticmethod
    def resolve_alert(alert_id):
        """
        Resolve an alert.
        
        Args:
            alert_id (int): ID of the alert to resolve
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            alert = MonitoringAlert.query.get(alert_id)
            if not alert:
                logger.error(f"Alert not found: {alert_id}")
                return False
                
            if alert.status == 'resolved':
                logger.warning(f"Alert {alert_id} already resolved")
                return True
                
            alert.status = 'resolved'
            alert.resolved_at = datetime.now()
            db.session.commit()
            
            logger.info(f"Alert {alert_id} resolved")
            return True
            
        except Exception as e:
            logger.error(f"Error resolving alert: {str(e)}")
            db.session.rollback()
            return False
    
    @staticmethod
    def get_active_alerts(component=None, max_count=100):
        """
        Get active alerts.
        
        Args:
            component (str, optional): Filter by component
            max_count (int, optional): Maximum number of alerts to return
            
        Returns:
            list: List of active alert objects
        """
        try:
            query = MonitoringAlert.query.filter(MonitoringAlert.status != 'resolved')
            
            if component:
                query = query.filter_by(component=component)
                
            return query.order_by(MonitoringAlert.created_at.desc()).limit(max_count).all()
            
        except Exception as e:
            logger.error(f"Error getting active alerts: {str(e)}")
            return []
    
    @staticmethod
    def send_alert_notifications(alert):
        """
        Send notifications for an alert.
        
        Args:
            alert (MonitoringAlert): The alert to send notifications for
            
        Returns:
            bool: True if notifications were sent successfully, False otherwise
        """
        try:
            # If notifications were already sent, don't send again
            if alert.notifications_sent:
                logger.info(f"Notifications already sent for alert {alert.id}")
                return True
                
            # Find notification channels for this alert type and severity
            severity_levels = {
                'critical': 4,
                'error': 3,
                'warning': 2,
                'info': 1
            }
            
            alert_severity_level = severity_levels.get(alert.severity.lower(), 0)
            
            # Get all active notification mappings
            mappings = AlertNotificationMap.query.filter_by(is_active=True).all()
            
            channels_to_notify = []
            for mapping in mappings:
                # Check if this mapping applies to this alert type
                if mapping.alert_type == alert.alert_type or mapping.alert_type == '*':
                    # Check if this mapping applies to this severity level
                    mapping_severity_level = severity_levels.get(mapping.min_severity.lower(), 0)
                    if alert_severity_level >= mapping_severity_level:
                        # Get the associated channel if active
                        channel = NotificationChannel.query.get(mapping.channel_id)
                        if channel and channel.is_active:
                            channels_to_notify.append(channel)
            
            if not channels_to_notify:
                logger.warning(f"No notification channels found for alert {alert.id}")
                return False
                
            # Send notifications through each channel
            success = False
            for channel in channels_to_notify:
                if AlertManager._send_notification(channel, alert):
                    success = True
            
            # Mark notifications as sent
            if success:
                alert.notifications_sent = True
                alert.notification_sent_at = datetime.now()
                db.session.commit()
                
            return success
            
        except Exception as e:
            logger.error(f"Error sending alert notifications: {str(e)}")
            return False
    
    @staticmethod
    def _send_notification(channel, alert):
        """
        Send a notification through a specific channel.
        
        Args:
            channel (NotificationChannel): The notification channel to use
            alert (MonitoringAlert): The alert to send
            
        Returns:
            bool: True if the notification was sent successfully, False otherwise
        """
        try:
            # Parse channel config
            config = json.loads(channel.config)
            
            # Format alert message
            alert_details = f"Component: {alert.component}\nCreated: {alert.created_at}\n"
            if alert.details:
                alert_details += f"\nDetails:\n{alert.details}"
                
            # Send through appropriate channel
            if channel.channel_type == 'slack':
                return NotificationService.send_slack_alert(
                    message=alert.message,
                    severity=alert.severity,
                    channel=config.get('channel_id'),
                    attachments=[{
                        "title": f"Alert: {alert.alert_type}",
                        "text": alert_details,
                        "color": AlertManager._get_severity_color(alert.severity)
                    }]
                )
            elif channel.channel_type == 'email':
                subject = f"{alert.severity.upper()} Alert: {alert.alert_type} - {alert.component}"
                html_message = f"""
                <h2>{alert.severity.upper()} Alert</h2>
                <p><strong>Type:</strong> {alert.alert_type}</p>
                <p><strong>Component:</strong> {alert.component}</p>
                <p><strong>Time:</strong> {alert.created_at}</p>
                <p><strong>Message:</strong> {alert.message}</p>
                {f'<h3>Details:</h3><pre>{alert.details}</pre>' if alert.details else ''}
                """
                return NotificationService.send_email_alert(
                    subject=subject,
                    message=html_message,
                    recipients=config.get('recipients', [])
                )
            elif channel.channel_type == 'sms':
                message = f"{alert.severity.upper()} Alert: {alert.message}"
                return NotificationService.send_sms_alert(
                    message=message,
                    recipients=config.get('recipients', [])
                )
            else:
                logger.error(f"Unsupported notification channel type: {channel.channel_type}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending notification through channel {channel.id}: {str(e)}")
            return False
    
    @staticmethod
    def _get_severity_color(severity):
        """Get the appropriate color for a severity level."""
        severity = severity.lower()
        if severity == "critical":
            return "#FF0000"  # Red
        elif severity == "error":
            return "#FF8000"  # Orange
        elif severity == "warning":
            return "#FFFF00"  # Yellow
        else:
            return "#00FF00"  # Green

    @staticmethod
    def check_alert_rules():
        """
        Check all active alert rules.
        
        Returns:
            int: Number of alerts generated
        """
        try:
            # Get all active alert rules
            rules = AlertRule.query.filter_by(is_active=True).all()
            
            alerts_generated = 0
            for rule in rules:
                try:
                    # Parse condition config
                    condition = json.loads(rule.condition_config)
                    
                    # Check if rule should fire
                    if AlertManager._evaluate_rule_condition(rule.condition_type, condition, rule.component):
                        # Create alert
                        alert = AlertManager.create_alert(
                            alert_type=rule.alert_type,
                            severity=rule.severity,
                            component=rule.component,
                            message=rule.name,
                            details=rule.description,
                            rule_id=rule.id
                        )
                        
                        if alert:
                            alerts_generated += 1
                            
                except Exception as e:
                    logger.error(f"Error evaluating rule {rule.id}: {str(e)}")
                    
            return alerts_generated
            
        except Exception as e:
            logger.error(f"Error checking alert rules: {str(e)}")
            return 0
    
    @staticmethod
    def _evaluate_rule_condition(condition_type, condition, component):
        """
        Evaluate an alert rule condition.
        
        Args:
            condition_type (str): Type of condition (threshold, pattern, etc.)
            condition (dict): Condition configuration
            component (str): Component to monitor
            
        Returns:
            bool: True if the condition is met, False otherwise
        """
        # Implementation will depend on specific condition types
        # This is a simplified example
        if condition_type == 'threshold':
            # Example: check if a metric exceeds a threshold
            from models import SystemMetric
            
            metric_name = condition.get('metric_name')
            threshold = condition.get('threshold')
            operator = condition.get('operator', '>')  # Default to greater than
            
            # Get the latest metric value
            metric = SystemMetric.query.filter_by(
                metric_name=metric_name,
                component=component
            ).order_by(SystemMetric.timestamp.desc()).first()
            
            if not metric:
                return False
                
            # Compare based on operator
            if operator == '>':
                return metric.metric_value > threshold
            elif operator == '>=':
                return metric.metric_value >= threshold
            elif operator == '<':
                return metric.metric_value < threshold
            elif operator == '<=':
                return metric.metric_value <= threshold
            elif operator == '==':
                return metric.metric_value == threshold
            else:
                return False
                
        elif condition_type == 'pattern':
            # Example: check for error patterns in logs
            # Implementation would depend on log storage mechanism
            return False
            
        elif condition_type == 'frequency':
            # Example: check if an event occurs too frequently
            event_type = condition.get('event_type')
            count = condition.get('count')
            period_minutes = condition.get('period_minutes', 60)
            
            # Logic to check event frequency would go here
            # ...
            
            return False
            
        else:
            logger.warning(f"Unsupported condition type: {condition_type}")
            return False