"""
Scheduled task management for AI feedback reports and other automated tasks.
"""
import logging
import threading
import time
from datetime import datetime, timedelta
import schedule

from utils.email_reports import send_feedback_report

# Setup logger
logger = logging.getLogger(__name__)

# Global flag to control the background thread
_keep_running = True

# Global thread object
_scheduler_thread = None

def schedule_daily_reports(email):
    """
    Schedule daily feedback reports.
    
    Args:
        email (str): Email address to send reports to
    """
    logger.info(f"Scheduling daily reports to {email}")
    schedule.every().day.at("06:00").do(send_feedback_report, email, 'daily')

def schedule_weekly_reports(email, day_of_week=0):
    """
    Schedule weekly feedback reports.
    
    Args:
        email (str): Email address to send reports to
        day_of_week (int): Day of week (0-6, where 0 is Monday)
    """
    logger.info(f"Scheduling weekly reports to {email} on day {day_of_week}")
    
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    day_name = days[day_of_week] if 0 <= day_of_week < 7 else "monday"
    
    getattr(schedule.every(), day_name).at("08:00").do(send_feedback_report, email, 'weekly')

def schedule_monthly_reports(email, day_of_month=1):
    """
    Schedule monthly feedback reports.
    
    Args:
        email (str): Email address to send reports to
        day_of_month (int): Day of month (1-31)
    """
    logger.info(f"Scheduling monthly reports to {email} on day {day_of_month}")
    
    def monthly_job():
        # Check if today is the right day of the month
        today = datetime.now()
        if today.day == day_of_month:
            return send_feedback_report(email, 'monthly')
        return None
    
    # Run the check daily
    schedule.every().day.at("07:00").do(monthly_job)

def _scheduler_loop():
    """
    Main loop for the scheduler thread.
    """
    logger.info("Starting scheduler thread")
    
    while _keep_running:
        try:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
        except Exception as e:
            logger.error(f"Error in scheduler thread: {str(e)}")
            # Sleep briefly to avoid tight error loops
            time.sleep(5)
    
    logger.info("Scheduler thread stopped")

def start_scheduler():
    """
    Start the scheduler in a background thread.
    
    Returns:
        bool: True if started, False if already running
    """
    global _scheduler_thread, _keep_running
    
    if _scheduler_thread and _scheduler_thread.is_alive():
        logger.warning("Scheduler thread is already running")
        return False
    
    _keep_running = True
    _scheduler_thread = threading.Thread(target=_scheduler_loop, daemon=True)
    _scheduler_thread.start()
    
    logger.info("Scheduler thread started")
    return True

def stop_scheduler():
    """
    Stop the scheduler thread.
    
    Returns:
        bool: True if stopped successfully, False if not running
    """
    global _keep_running
    
    if not _scheduler_thread or not _scheduler_thread.is_alive():
        logger.warning("Scheduler thread is not running")
        return False
    
    _keep_running = False
    
    # Wait for thread to terminate
    timeout_sec = 5
    _scheduler_thread.join(timeout_sec)
    
    if _scheduler_thread.is_alive():
        logger.warning(f"Scheduler thread did not stop within {timeout_sec} seconds")
        return False
    
    logger.info("Scheduler thread stopped successfully")
    return True

def clear_all_schedules():
    """
    Clear all scheduled jobs.
    """
    schedule.clear()
    logger.info("All scheduled jobs cleared")

def check_scheduler_status():
    """
    Check if the scheduler thread is running.
    
    Returns:
        bool: True if running, False otherwise
    """
    return _scheduler_thread is not None and _scheduler_thread.is_alive()

def get_scheduled_jobs():
    """
    Get a list of all scheduled jobs.
    
    Returns:
        list: List of scheduled jobs
    """
    return schedule.get_jobs()

def initialize_default_schedules(admin_email):
    """
    Initialize default scheduled tasks.
    
    Args:
        admin_email (str): Admin email address for reports
    """
    if not admin_email:
        logger.warning("No admin email provided, skipping default schedule initialization")
        return
    
    # Clear any existing schedules
    clear_all_schedules()
    
    # Schedule weekly reports for Monday at 8 AM
    schedule_weekly_reports(admin_email, 0)
    
    # Schedule monthly reports for the 1st of the month
    schedule_monthly_reports(admin_email, 1)
    
    logger.info(f"Default schedules initialized with admin email: {admin_email}")
    
    # Start the scheduler if it's not already running
    if not check_scheduler_status():
        start_scheduler()