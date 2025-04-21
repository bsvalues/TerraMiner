"""
Notification service for sending alerts and notifications through various channels.
"""
import os
import logging
import json
from datetime import datetime

# Set up logging
logger = logging.getLogger(__name__)

class NotificationService:
    """Service for sending notifications through various channels."""
    
    @staticmethod
    def send_slack_alert(message, severity="info", channel=None, attachments=None):
        """
        Send an alert message to Slack.
        
        Args:
            message (str): The alert message.
            severity (str): The severity level (info, warning, error, critical).
            channel (str, optional): The Slack channel to send to. If None, uses the default channel.
            attachments (list, optional): A list of attachment dictionaries for rich formatting.
            
        Returns:
            bool: True if the message was sent successfully, False otherwise.
        """
        try:
            from slack_sdk import WebClient
            from slack_sdk.errors import SlackApiError
            
            slack_token = os.environ.get("SLACK_BOT_TOKEN")
            default_channel = os.environ.get("SLACK_CHANNEL_ID")
            
            if not slack_token:
                logger.error("SLACK_BOT_TOKEN environment variable not set")
                return False
                
            channel_id = channel or default_channel
            if not channel_id:
                logger.error("SLACK_CHANNEL_ID environment variable not set and no channel provided")
                return False
            
            # Initialize Slack client
            client = WebClient(token=slack_token)
            
            # Create message with appropriate emoji for severity
            emoji = NotificationService._get_severity_emoji(severity)
            formatted_message = f"{emoji} *{severity.upper()}*: {message}"
            
            # Prepare attachments if any
            slack_attachments = attachments or []
            
            # Add timestamp to attachments
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if not attachments:
                slack_attachments = [
                    {
                        "color": NotificationService._get_severity_color(severity),
                        "fields": [
                            {
                                "title": "Time",
                                "value": timestamp,
                                "short": True
                            },
                            {
                                "title": "Severity",
                                "value": severity.upper(),
                                "short": True
                            }
                        ],
                        "footer": "NARRPR Monitoring System"
                    }
                ]
            
            # Send message to Slack
            response = client.chat_postMessage(
                channel=channel_id,
                text=formatted_message,
                attachments=slack_attachments,
                unfurl_links=False,
                unfurl_media=False
            )
            
            if response["ok"]:
                logger.info(f"Slack alert sent successfully: {message}")
                return True
            else:
                logger.error(f"Failed to send Slack alert: {response.get('error', 'Unknown error')}")
                return False
                
        except ImportError:
            logger.error("slack_sdk package not installed")
            return False
        except Exception as e:
            logger.error(f"Error sending Slack alert: {str(e)}")
            return False
    
    @staticmethod
    def send_email_alert(subject, message, recipients, attachments=None):
        """
        Send an alert email.
        
        Args:
            subject (str): The email subject.
            message (str): The email message body.
            recipients (list): A list of recipient email addresses.
            attachments (list, optional): A list of file paths to attach.
            
        Returns:
            bool: True if the email was sent successfully, False otherwise.
        """
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition, ContentId
            import base64
            import mimetypes
            
            sendgrid_api_key = os.environ.get("SENDGRID_API_KEY")
            sender_email = os.environ.get("SENDGRID_SENDER_EMAIL") or "monitoring@narrpr-scraper.app"
            
            if not sendgrid_api_key:
                logger.error("SENDGRID_API_KEY environment variable not set")
                return False
            
            # Create email message
            mail = Mail(
                from_email=sender_email,
                to_emails=recipients,
                subject=subject,
                html_content=message
            )
            
            # Add attachments if any
            if attachments:
                for file_path in attachments:
                    if os.path.isfile(file_path):
                        with open(file_path, 'rb') as f:
                            file_data = f.read()
                            file_name = os.path.basename(file_path)
                            file_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
                            
                            encoded_file = base64.b64encode(file_data).decode()
                            attachment = Attachment()
                            attachment.file_content = FileContent(encoded_file)
                            attachment.file_name = FileName(file_name)
                            attachment.file_type = FileType(file_type)
                            attachment.disposition = Disposition('attachment')
                            attachment.content_id = ContentId(file_name)
                            
                            mail.add_attachment(attachment)
            
            # Send email
            sg = SendGridAPIClient(sendgrid_api_key)
            response = sg.send(mail)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email alert sent successfully to {', '.join(recipients)}")
                return True
            else:
                logger.error(f"Failed to send email alert: {response.body}")
                return False
                
        except ImportError:
            logger.error("sendgrid package not installed")
            return False
        except Exception as e:
            logger.error(f"Error sending email alert: {str(e)}")
            return False
    
    @staticmethod
    def send_sms_alert(message, recipients):
        """
        Send an SMS alert.
        
        Args:
            message (str): The SMS message body.
            recipients (list): A list of recipient phone numbers.
            
        Returns:
            bool: True if the SMS was sent successfully, False otherwise.
        """
        try:
            from twilio.rest import Client
            
            twilio_account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
            twilio_auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
            twilio_phone_number = os.environ.get("TWILIO_PHONE_NUMBER")
            
            if not twilio_account_sid or not twilio_auth_token or not twilio_phone_number:
                logger.error("Twilio environment variables not set")
                return False
            
            # Initialize Twilio client
            client = Client(twilio_account_sid, twilio_auth_token)
            
            # Send SMS to each recipient
            success_count = 0
            for recipient in recipients:
                try:
                    sms = client.messages.create(
                        body=message,
                        from_=twilio_phone_number,
                        to=recipient
                    )
                    logger.info(f"SMS alert sent to {recipient} with SID: {sms.sid}")
                    success_count += 1
                except Exception as e:
                    logger.error(f"Error sending SMS to {recipient}: {str(e)}")
            
            # Return True if at least one SMS was sent successfully
            return success_count > 0
                
        except ImportError:
            logger.error("twilio package not installed")
            return False
        except Exception as e:
            logger.error(f"Error sending SMS alert: {str(e)}")
            return False
    
    @staticmethod
    def _get_severity_emoji(severity):
        """Get the appropriate emoji for a severity level."""
        severity = severity.lower()
        if severity == "critical":
            return ":rotating_light:"
        elif severity == "error":
            return ":x:"
        elif severity == "warning":
            return ":warning:"
        else:
            return ":information_source:"
    
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