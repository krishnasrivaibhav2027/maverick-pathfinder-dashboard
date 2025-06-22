from .config import settings
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

def send_welcome_email(user_email, user_name, emp_id, temp_password):
    """Send welcome email with credentials using SMTP."""
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = settings.WELCOME_EMAIL_SUBJECT
    msg['From'] = formataddr((settings.SENDER_NAME, settings.SENDER_EMAIL))
    msg['To'] = user_email
    
    # Create HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to Maverick Pathfinder</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .credentials {{ background: #e8f4fd; border: 1px solid #bee5eb; border-radius: 5px; padding: 20px; margin: 20px 0; }}
            .credential-item {{ margin: 10px 0; }}
            .label {{ font-weight: bold; color: #495057; }}
            .value {{ font-family: monospace; background: white; padding: 5px 10px; border-radius: 3px; border: 1px solid #dee2e6; }}
            .button {{ display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to Maverick Pathfinder!</h1>
                <p>Your AI-Powered Training Journey Begins</p>
            </div>
            <div class="content">
                <h2>Hello {user_name}!</h2>
                <p>Welcome to Maverick Pathfinder! Your account has been successfully created and you're now ready to begin your personalized training journey.</p>
                
                <div class="credentials">
                    <h3>🔐 Your Login Credentials</h3>
                    <div class="credential-item">
                        <span class="label">Employee ID:</span>
                        <span class="value">{emp_id}</span>
                    </div>
                    <div class="credential-item">
                        <span class="label">Email:</span>
                        <span class="value">{user_email}</span>
                    </div>
                    <div class="credential-item">
                        <span class="label">Temporary Password:</span>
                        <span class="value">{temp_password}</span>
                    </div>
                </div>
                
                <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
                
                <a href="http://localhost:8085" class="button">🚀 Start Your Training</a>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                
                    <p>Best regards,<br>
                <strong>The Maverick Pathfinder Team</strong></p>
                </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; 2024 Maverick Pathfinder. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Create plain text content
    text_content = f"""
    Welcome to Maverick Pathfinder!
    
    Hello {user_name},
    
Welcome to Maverick Pathfinder! Your account has been successfully created and you're now ready to begin your personalized training journey.

Your Login Credentials:
- Employee ID: {emp_id}
- Email: {user_email}
- Temporary Password: {temp_password}

Important: Please change your password after your first login for security purposes.

Start your training at: http://localhost:8085

If you have any questions or need assistance, please don't hesitate to contact our support team.
    
    Best regards,
    The Maverick Pathfinder Team

---
This is an automated message. Please do not reply to this email.
© 2024 Maverick Pathfinder. All rights reserved.
    """
    
    # Attach parts
    msg.attach(MIMEText(text_content, 'plain'))
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        # Create SMTP session
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()  # Enable TLS
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        
        # Send email
        text = msg.as_string()
        server.sendmail(settings.SENDER_EMAIL, user_email, text)
        server.quit()
        
        print(f"✅ Welcome email sent successfully via SMTP to {user_email}")
        return True, "Email sent successfully via SMTP"
        
    except Exception as e:
        print(f"❌ Error sending email via SMTP: {str(e)}")
        return False, f"Error sending email via SMTP: {str(e)}"

def test_smtp_connection():
    """Test the SMTP connection."""
    try:
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.quit()
        return True, "SMTP connection successful."
    except Exception as e:
        return False, f"SMTP connection failed: {e}"
