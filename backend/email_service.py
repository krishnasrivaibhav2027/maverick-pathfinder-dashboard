from mailjet_rest import Client
import random
import string

# Mailjet configuration
MAILJET_API_KEY = "29d464530f14721297b2ff611c3756e7"
MAILJET_API_SECRET = "mail@2027"
SENDER_EMAIL = "gksvaibav99@gmail.com"

# Initialize Mailjet client
mailjet = Client(auth=(MAILJET_API_KEY, MAILJET_API_SECRET), version='v3.1')

def generate_temp_password(length=12):
    """Generate a random temporary password with specific requirements"""
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special_chars = "!@#$%^&*"
    
    # Ensure at least 2 of each type
    password = [
        random.choice(uppercase), random.choice(uppercase),
        random.choice(lowercase), random.choice(lowercase),
        random.choice(digits), random.choice(digits),
        random.choice(special_chars), random.choice(special_chars)
    ]
    
    # Fill the rest randomly
    all_chars = uppercase + lowercase + digits + special_chars
    for _ in range(length - 8):
        password.append(random.choice(all_chars))
    
    # Shuffle the password
    random.shuffle(password)
    return ''.join(password)

def send_welcome_email(user_email, user_name, emp_id, temp_password):
    """Send welcome email with credentials to new user"""
    
    subject = "🎉 Welcome to Maverick Pathfinder - Your Training Journey Begins!"
    
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
            .credentials-box {{ background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .credential-item {{ margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 5px; }}
            .important {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; }}
            .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Welcome to Maverick Pathfinder!</h1>
                <p>Your AI-Powered Training Journey Starts Now</p>
            </div>
            
            <div class="content">
                <h2>Hello {user_name}! 👋</h2>
                <p>Congratulations! Your training account has been successfully created by our AI system. We're excited to have you join the Maverick training program.</p>
                
                <div class="credentials-box">
                    <h3>🔐 Your Login Credentials</h3>
                    <div class="credential-item">
                        <strong>Employee ID:</strong> <code>{emp_id}</code>
                    </div>
                    <div class="credential-item">
                        <strong>Email:</strong> <code>{user_email}</code>
                    </div>
                    <div class="credential-item">
                        <strong>Temporary Password:</strong> <code>{temp_password}</code>
                    </div>
                </div>
                
                <div class="important">
                    <h4>🔒 Important Security Information:</h4>
                    <ul>
                        <li>Please change your password after your first login</li>
                        <li>Keep your credentials secure and don't share them</li>
                        <li>Your account will be activated within 24 hours</li>
                        <li>If you have any issues, contact our support team</li>
                    </ul>
                </div>
                
                <h3>🎯 What's Next?</h3>
                <ol>
                    <li><strong>Login:</strong> Use your credentials to access the training portal</li>
                    <li><strong>Complete Profile:</strong> Fill out your training preferences</li>
                    <li><strong>Start Learning:</strong> Begin with Phase 1 foundation training</li>
                    <li><strong>Track Progress:</strong> Monitor your advancement through our AI-powered dashboard</li>
                </ol>
                
                <div style="text-align: center;">
                    <a href="#" class="button">Access Training Portal</a>
                </div>
                
                <h3>📚 Training Program Overview:</h3>
                <p><strong>Phase 1:</strong> Foundation training covering programming basics, problem-solving, and core concepts.</p>
                <p><strong>Phase 2:</strong> Specialized training in Python, Java, or .NET based on your Phase 1 performance and AI recommendations.</p>
                
                <div class="footer">
                    <p>Best regards,<br>
                    <strong>The Maverick Pathfinder Team</strong><br>
                    🤖 Powered by AI • 📈 Driven by Excellence</p>
                    
                    <p style="font-size: 12px; color: #999;">
                        This email was automatically generated by our AI system. 
                        If you didn't request this account, please contact support immediately.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Welcome to Maverick Pathfinder!
    
    Hello {user_name},
    
    Your training account has been successfully created by our AI system.
    
    LOGIN CREDENTIALS:
    Employee ID: {emp_id}
    Email: {user_email}
    Temporary Password: {temp_password}
    
    IMPORTANT SECURITY NOTES:
    - Please change your password after your first login
    - Keep your credentials secure and don't share them
    - Your account will be activated within 24 hours
    
    WHAT'S NEXT:
    1. Login using your credentials
    2. Complete your profile setup
    3. Start with Phase 1 foundation training
    4. Track your progress through our AI-powered dashboard
    
    TRAINING PROGRAM:
    Phase 1: Foundation training (programming basics, problem-solving)
    Phase 2: Specialized training (Python/Java/.NET based on AI recommendations)
    
    Best regards,
    The Maverick Pathfinder Team
    Powered by AI • Driven by Excellence
    
    ---
    This email was automatically generated by our AI system.
    If you didn't request this account, please contact support immediately.
    """
    
    data = {
        'Messages': [
            {
                "From": {
                    "Email": SENDER_EMAIL,
                    "Name": "Maverick Pathfinder Training"
                },
                "To": [
                    {
                        "Email": user_email,
                        "Name": user_name
                    }
                ],
                "Subject": subject,
                "TextPart": text_content,
                "HTMLPart": html_content
            }
        ]
    }
    
    try:
        result = mailjet.send.create(data=data)
        if result.status_code == 200:
            print(f"✅ Welcome email sent successfully to {user_email}")
            return True, "Email sent successfully"
        else:
            print(f"❌ Failed to send email: {result.status_code} - {result.json()}")
            return False, f"Failed to send email: {result.status_code}"
    except Exception as e:
        print(f"❌ Error sending email: {str(e)}")
        return False, f"Error sending email: {str(e)}"

def send_password_reset_email(user_email, user_name, new_password):
    """Send password reset email"""
    subject = "🔐 Maverick Pathfinder - Password Reset"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #667eea;">Password Reset - Maverick Pathfinder</h2>
            <p>Hello {user_name},</p>
            <p>Your password has been reset as requested.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>New Password:</h3>
                <p style="font-family: monospace; font-size: 16px; background: white; padding: 10px; border-radius: 3px;">
                    {new_password}
                </p>
            </div>
            
            <p><strong>Important:</strong> Please change this password after logging in.</p>
            
            <p>Best regards,<br>Maverick Pathfinder Team</p>
        </div>
    </body>
    </html>
    """
    
    data = {
        'Messages': [
            {
                "From": {
                    "Email": SENDER_EMAIL,
                    "Name": "Maverick Pathfinder Training"
                },
                "To": [
                    {
                        "Email": user_email,
                        "Name": user_name
                    }
                ],
                "Subject": subject,
                "HTMLPart": html_content
            }
        ]
    }
    
    try:
        result = mailjet.send.create(data=data)
        return result.status_code == 200, "Password reset email sent" if result.status_code == 200 else f"Failed: {result.status_code}"
    except Exception as e:
        return False, f"Error: {str(e)}"