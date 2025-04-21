"""
Notification service for sending alerts through various channels.
"""
import os
import json
import logging
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Set up logger
logger = logging.getLogger(__name__)

class NotificationService:
    """
    Service for sending notifications through various channels.
    """
    
    def __init__(self):
        """
        Initialize notification service.
        """
        # Setup for Slack
        self.slack_token = os.environ.get('SLACK_BOT_TOKEN')
        if self.slack_token:
            try:
                from slack_sdk import WebClient
                from slack_sdk.errors import SlackApiError
                self.slack_client = WebClient(token=self.slack_token)
                self.slack_available = True
                logger.info("Slack notification service initialized")
            except ImportError:
                logger.warning("Slack SDK not installed. Slack notifications will not be available.")
                self.slack_available = False
            except Exception as e:
                logger.error(f"Error initializing Slack client: {str(e)}")
                self.slack_available = False
        else:
            logger.warning("SLACK_BOT_TOKEN not found in environment variables. Slack notifications will not be available.")
            self.slack_available = False
            
        # Setup for Email (SendGrid)
        self.sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
        if self.sendgrid_api_key:
            try:
                self.email_available = True
                logger.info("Email notification service initialized (SendGrid)")
            except Exception as e:
                logger.error(f"Error initializing SendGrid client: {str(e)}")
                self.email_available = False
        else:
            logger.warning("SENDGRID_API_KEY not found in environment variables. Email notifications will not be available via SendGrid.")
            self.email_available = False
            
        # Try SMTP as fallback if SendGrid is not available
        if not self.email_available:
            self.smtp_host = os.environ.get('SMTP_HOST')
            self.smtp_port = os.environ.get('SMTP_PORT')
            self.smtp_username = os.environ.get('SMTP_USERNAME')
            self.smtp_password = os.environ.get('SMTP_PASSWORD')
            self.smtp_from_email = os.environ.get('SMTP_FROM_EMAIL')
            
            if self.smtp_host and self.smtp_port and self.smtp_username and self.smtp_password and self.smtp_from_email:
                self.email_available = True
                logger.info("Email notification service initialized (SMTP)")
            else:
                logger.warning("SMTP configuration incomplete. Email notifications will not be available.")
                self.email_available = False
            
        # Setup for SMS (Twilio)
        self.twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        self.twilio_auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        self.twilio_phone_number = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if self.twilio_account_sid and self.twilio_auth_token and self.twilio_phone_number:
            try:
                self.sms_available = True
                logger.info("SMS notification service initialized")
            except Exception as e:
                logger.error(f"Error initializing Twilio client: {str(e)}")
                self.sms_available = False
        else:
            logger.warning("Twilio credentials not found in environment variables. SMS notifications will not be available.")
            self.sms_available = False
            
    def send_slack_notification(self, message, channel_id, severity='info'):
        """
        Send a notification to a Slack channel.
        
        Args:
            message (str): The message to send
            channel_id (str): The Slack channel ID to send the message to
            severity (str, optional): The severity level, used for formatting. Defaults to 'info'.
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.slack_available:
            logger.warning("Slack notifications are not available")
            return False
            
        try:
            from slack_sdk import WebClient
            from slack_sdk.errors import SlackApiError
            
            # Format the message with appropriate emoji based on severity
            emoji = ":information_source:"
            if severity == 'warning':
                emoji = ":warning:"
            elif severity == 'error':
                emoji = ":x:"
            elif severity == 'critical':
                emoji = ":rotating_light:"
                
            # Add emoji to beginning of message
            formatted_message = f"{emoji} {message}"
            
            response = self.slack_client.chat_postMessage(
                channel=channel_id,
                text=formatted_message,
                unfurl_links=False,
                unfurl_media=False
            )
            
            logger.info(f"Sent Slack notification to channel {channel_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending Slack notification: {str(e)}")
            return False
            
    def send_email_notification(self, subject, message, recipients, severity='info'):
        """
        Send an email notification.
        
        Args:
            subject (str): The email subject
            message (str): The email message
            recipients (list): List of email addresses to send to
            severity (str, optional): The severity level, used for formatting. Defaults to 'info'.
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.email_available:
            logger.warning("Email notifications are not available")
            return False
            
        try:
            # For SendGrid
            if self.sendgrid_api_key:
                import sendgrid
                from sendgrid.helpers.mail import Mail, Email, To, Content
                
                sg = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
                
                # Format HTML content
                html_content = f"""
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; }}
                        .alert-header {{ padding: 10px; border-radius: 5px; margin-bottom: 20px; }}
                        .severity-info {{ background-color: #d9edf7; color: #31708f; }}
                        .severity-warning {{ background-color: #fcf8e3; color: #8a6d3b; }}
                        .severity-error {{ background-color: #f2dede; color: #a94442; }}
                        .severity-critical {{ background-color: #f2dede; color: #a94442; font-weight: bold; }}
                        pre {{ background-color: #f5f5f5; padding: 10px; border-radius: 5px; }}
                    </style>
                </head>
                <body>
                    <div class="alert-header severity-{severity}">
                        <h2>{subject}</h2>
                    </div>
                    <pre>{message}</pre>
                    <p>Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </body>
                </html>
                """
                
                # Create message
                from_email = Email(self.smtp_from_email or "alerts@example.com")
                
                for recipient in recipients:
                    to_email = To(recipient)
                    content = Content("text/html", html_content)
                    mail = Mail(from_email, to_email, subject, content)
                    
                    try:
                        response = sg.client.mail.send.post(request_body=mail.get())
                        logger.info(f"Sent email notification to {recipient}")
                    except Exception as e:
                        logger.error(f"Error sending email to {recipient}: {str(e)}")
                        
                return True
                
            # For SMTP
            else:
                # Create message
                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = self.smtp_from_email
                
                # Format HTML content
                html_content = f"""
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; }}
                        .alert-header {{ padding: 10px; border-radius: 5px; margin-bottom: 20px; }}
                        .severity-info {{ background-color: #d9edf7; color: #31708f; }}
                        .severity-warning {{ background-color: #fcf8e3; color: #8a6d3b; }}
                        .severity-error {{ background-color: #f2dede; color: #a94442; }}
                        .severity-critical {{ background-color: #f2dede; color: #a94442; font-weight: bold; }}
                        pre {{ background-color: #f5f5f5; padding: 10px; border-radius: 5px; }}
                    </style>
                </head>
                <body>
                    <div class="alert-header severity-{severity}">
                        <h2>{subject}</h2>
                    </div>
                    <pre>{message}</pre>
                    <p>Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </body>
                </html>
                """
                
                # Attach parts
                text_part = MIMEText(message, 'plain')
                html_part = MIMEText(html_content, 'html')
                msg.attach(text_part)
                msg.attach(html_part)
                
                # Connect to SMTP server and send
                smtp = smtplib.SMTP(self.smtp_host, int(self.smtp_port))
                smtp.starttls()
                smtp.login(self.smtp_username, self.smtp_password)
                
                for recipient in recipients:
                    msg['To'] = recipient
                    try:
                        smtp.sendmail(self.smtp_from_email, recipient, msg.as_string())
                        logger.info(f"Sent email notification to {recipient}")
                    except Exception as e:
                        logger.error(f"Error sending email to {recipient}: {str(e)}")
                        
                smtp.quit()
                return True
                
        except Exception as e:
            logger.error(f"Error sending email notification: {str(e)}")
            return False
            
    def send_sms_notification(self, message, recipients):
        """
        Send an SMS notification.
        
        Args:
            message (str): The SMS message
            recipients (list): List of phone numbers to send to
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.sms_available:
            logger.warning("SMS notifications are not available")
            return False
            
        try:
            from twilio.rest import Client
            
            client = Client(self.twilio_account_sid, self.twilio_auth_token)
            
            # Limit message length for SMS
            if len(message) > 160:
                message = message[:157] + "..."
                
            success_count = 0
            for recipient in recipients:
                try:
                    message_obj = client.messages.create(
                        body=message,
                        from_=self.twilio_phone_number,
                        to=recipient
                    )
                    logger.info(f"Sent SMS to {recipient} (SID: {message_obj.sid})")
                    success_count += 1
                except Exception as e:
                    logger.error(f"Error sending SMS to {recipient}: {str(e)}")
                    
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Error sending SMS notification: {str(e)}")
            return False