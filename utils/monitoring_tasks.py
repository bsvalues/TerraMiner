"""
Scheduled tasks for monitoring the system and triggering alerts.
"""
import time
import json
import logging
import threading
import schedule
import traceback
import platform
import psutil
from datetime import datetime, timedelta

import psutil
import socket
import requests

from app import app, db
from models import SystemMetric, MonitoringAlert, APIUsageLog, JobRun
from utils.alert_manager import AlertManager

# Set up logger
logger = logging.getLogger(__name__)

# Global variables
monitoring_thread = None
stop_event = threading.Event()

def collect_system_metrics():
    """
    Collect system metrics and store in database.
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        metrics = []
        
        # Collect CPU metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        metrics.append({
            'metric_name': 'cpu_percent',
            'metric_value': cpu_percent,
            'metric_unit': '%',
            'category': 'performance',
            'component': 'system'
        })
        
        # Collect memory metrics
        memory = psutil.virtual_memory()
        metrics.append({
            'metric_name': 'memory_percent',
            'metric_value': memory.percent,
            'metric_unit': '%',
            'category': 'performance',
            'component': 'system'
        })
        metrics.append({
            'metric_name': 'memory_available',
            'metric_value': memory.available / (1024 * 1024),  # Convert to MB
            'metric_unit': 'MB',
            'category': 'resource',
            'component': 'system'
        })
        
        # Collect disk metrics
        disk = psutil.disk_usage('/')
        metrics.append({
            'metric_name': 'disk_percent',
            'metric_value': disk.percent,
            'metric_unit': '%',
            'category': 'performance',
            'component': 'system'
        })
        metrics.append({
            'metric_name': 'disk_free',
            'metric_value': disk.free / (1024 * 1024 * 1024),  # Convert to GB
            'metric_unit': 'GB',
            'category': 'resource',
            'component': 'system'
        })
        
        # Collect network metrics
        net_io = psutil.net_io_counters()
        metrics.append({
            'metric_name': 'network_bytes_sent',
            'metric_value': net_io.bytes_sent / (1024 * 1024),  # Convert to MB
            'metric_unit': 'MB',
            'category': 'network',
            'component': 'system'
        })
        metrics.append({
            'metric_name': 'network_bytes_recv',
            'metric_value': net_io.bytes_recv / (1024 * 1024),  # Convert to MB
            'metric_unit': 'MB',
            'category': 'network',
            'component': 'system'
        })
        
        # Collect process metrics
        process = psutil.Process()
        metrics.append({
            'metric_name': 'process_memory',
            'metric_value': process.memory_info().rss / (1024 * 1024),  # Convert to MB
            'metric_unit': 'MB',
            'category': 'resource',
            'component': 'application'
        })
        metrics.append({
            'metric_name': 'process_threads',
            'metric_value': process.num_threads(),
            'metric_unit': 'count',
            'category': 'resource',
            'component': 'application'
        })
        
        # Try to get database metrics
        try:
            # Get number of connections (this is a simple estimation)
            with db.engine.connect() as connection:
                result = connection.execute(
                    "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()"
                ).fetchone()
                db_connections = result[0] if result else 0
                
                metrics.append({
                    'metric_name': 'db_connection_count',
                    'metric_value': db_connections,
                    'metric_unit': 'count',
                    'category': 'database',
                    'component': 'database'
                })
        except Exception as e:
            logger.warning(f"Could not collect database connection metrics: {str(e)}")
        
        # Store metrics in database
        timestamp = datetime.now()
        for metric_data in metrics:
            metric = SystemMetric(
                metric_name=metric_data['metric_name'],
                metric_value=metric_data['metric_value'],
                metric_unit=metric_data['metric_unit'],
                category=metric_data['category'],
                component=metric_data['component'],
                timestamp=timestamp
            )
            db.session.add(metric)
            
        db.session.commit()
        
        logger.debug("System metrics collected successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error collecting system metrics: {str(e)}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return False

def check_system_health():
    """
    Check system health and trigger alerts if needed.
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get latest metrics
        latest_metrics = {}
        
        # CPU
        cpu_metric = SystemMetric.query.filter_by(
            metric_name='cpu_percent', 
            component='system'
        ).order_by(SystemMetric.timestamp.desc()).first()
        
        if cpu_metric and cpu_metric.metric_value > 90:
            # Critical CPU usage
            AlertManager.create_alert(
                alert_type='high_cpu_usage',
                severity='critical',
                component='system',
                message=f'Critical CPU usage: {cpu_metric.metric_value}%',
                details='CPU usage has exceeded 90%. This may indicate a performance issue or resource contention.'
            )
        elif cpu_metric and cpu_metric.metric_value > 80:
            # High CPU usage
            AlertManager.create_alert(
                alert_type='high_cpu_usage',
                severity='warning',
                component='system',
                message=f'High CPU usage: {cpu_metric.metric_value}%',
                details='CPU usage has exceeded 80%. This may indicate increased load or a process consuming excessive resources.'
            )
        
        # Memory
        memory_metric = SystemMetric.query.filter_by(
            metric_name='memory_percent', 
            component='system'
        ).order_by(SystemMetric.timestamp.desc()).first()
        
        if memory_metric and memory_metric.metric_value > 90:
            # Critical memory usage
            AlertManager.create_alert(
                alert_type='high_memory_usage',
                severity='critical',
                component='system',
                message=f'Critical memory usage: {memory_metric.metric_value}%',
                details='Memory usage has exceeded 90%. This may lead to swapping or out-of-memory errors.'
            )
        elif memory_metric and memory_metric.metric_value > 80:
            # High memory usage
            AlertManager.create_alert(
                alert_type='high_memory_usage',
                severity='warning',
                component='system',
                message=f'High memory usage: {memory_metric.metric_value}%',
                details='Memory usage has exceeded 80%. This may lead to performance degradation.'
            )
        
        # Disk
        disk_metric = SystemMetric.query.filter_by(
            metric_name='disk_percent', 
            component='system'
        ).order_by(SystemMetric.timestamp.desc()).first()
        
        if disk_metric and disk_metric.metric_value > 90:
            # Critical disk usage
            AlertManager.create_alert(
                alert_type='high_disk_usage',
                severity='critical',
                component='system',
                message=f'Critical disk usage: {disk_metric.metric_value}%',
                details='Disk usage has exceeded 90%. This may lead to system failures or data loss.'
            )
        elif disk_metric and disk_metric.metric_value > 80:
            # High disk usage
            AlertManager.create_alert(
                alert_type='high_disk_usage',
                severity='warning',
                component='system',
                message=f'High disk usage: {disk_metric.metric_value}%',
                details='Disk usage has exceeded 80%. Consider freeing up space or expanding storage.'
            )
        
        # Database connections
        db_conn_metric = SystemMetric.query.filter_by(
            metric_name='db_connection_count', 
            component='database'
        ).order_by(SystemMetric.timestamp.desc()).first()
        
        if db_conn_metric and db_conn_metric.metric_value > 90:
            # High database connections
            AlertManager.create_alert(
                alert_type='high_db_connections',
                severity='warning',
                component='database',
                message=f'High database connections: {db_conn_metric.metric_value}',
                details='The number of database connections is approaching the limit. This may lead to connection failures.'
            )
        
        # Check error rates in last hour
        one_hour_ago = datetime.now() - timedelta(hours=1)
        total_requests = APIUsageLog.query.filter(
            APIUsageLog.timestamp >= one_hour_ago
        ).count()
        
        error_requests = APIUsageLog.query.filter(
            APIUsageLog.timestamp >= one_hour_ago,
            APIUsageLog.status_code >= 500
        ).count()
        
        if total_requests > 0:
            error_rate = (error_requests / total_requests) * 100
            if error_rate > 10:
                # High error rate
                AlertManager.create_alert(
                    alert_type='high_error_rate',
                    severity='error',
                    component='api',
                    message=f'High API error rate: {error_rate:.2f}%',
                    details=f'The API error rate has exceeded 10% in the last hour. {error_requests} errors out of {total_requests} requests.'
                )
            elif error_rate > 5:
                # Elevated error rate
                AlertManager.create_alert(
                    alert_type='elevated_error_rate',
                    severity='warning',
                    component='api',
                    message=f'Elevated API error rate: {error_rate:.2f}%',
                    details=f'The API error rate has exceeded 5% in the last hour. {error_requests} errors out of {total_requests} requests.'
                )
        
        # Check job failures in last 24 hours
        one_day_ago = datetime.now() - timedelta(days=1)
        total_jobs = JobRun.query.filter(
            JobRun.start_time >= one_day_ago
        ).count()
        
        failed_jobs = JobRun.query.filter(
            JobRun.start_time >= one_day_ago,
            JobRun.status == 'failed'
        ).count()
        
        if total_jobs > 0:
            failure_rate = (failed_jobs / total_jobs) * 100
            if failure_rate > 50:
                # High job failure rate
                AlertManager.create_alert(
                    alert_type='high_job_failure_rate',
                    severity='error',
                    component='etl',
                    message=f'High job failure rate: {failure_rate:.2f}%',
                    details=f'The job failure rate has exceeded 50% in the last 24 hours. {failed_jobs} failures out of {total_jobs} jobs.'
                )
            elif failure_rate > 20:
                # Elevated job failure rate
                AlertManager.create_alert(
                    alert_type='elevated_job_failure_rate',
                    severity='warning',
                    component='etl',
                    message=f'Elevated job failure rate: {failure_rate:.2f}%',
                    details=f'The job failure rate has exceeded 20% in the last 24 hours. {failed_jobs} failures out of {total_jobs} jobs.'
                )
        
        # Check any alert rules
        AlertManager.check_alert_rules()
        
        return True
        
    except Exception as e:
        logger.error(f"Error checking system health: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def monitoring_worker():
    """
    Worker function for monitoring thread.
    """
    logger.info("Starting monitoring worker")
    
    # Schedule tasks
    schedule.every(5).minutes.do(collect_system_metrics)
    schedule.every(10).minutes.do(check_system_health)
    
    # Run initial collection
    with app.app_context():
        collect_system_metrics()
    
    # Main loop
    while not stop_event.is_set():
        with app.app_context():
            schedule.run_pending()
        time.sleep(1)
    
    logger.info("Monitoring worker stopped")

def start_monitoring(interval=300):
    """
    Start the monitoring thread.
    
    Args:
        interval (int): Interval in seconds for collecting metrics
        
    Returns:
        bool: True if started successfully, False otherwise
    """
    global monitoring_thread, stop_event
    
    if monitoring_thread and monitoring_thread.is_alive():
        logger.warning("Monitoring thread already running")
        return False
    
    stop_event.clear()
    monitoring_thread = threading.Thread(target=monitoring_worker)
    monitoring_thread.daemon = True
    monitoring_thread.start()
    
    logger.info(f"System monitor started with interval of {interval} seconds")
    return True

def stop_monitoring():
    """
    Stop the monitoring thread.
    
    Returns:
        bool: True if stopped successfully, False otherwise
    """
    global monitoring_thread, stop_event
    
    if not monitoring_thread or not monitoring_thread.is_alive():
        logger.warning("Monitoring thread not running")
        return False
    
    stop_event.set()
    monitoring_thread.join(timeout=10)
    monitoring_thread = None
    
    logger.info("System monitor stopped")
    return True