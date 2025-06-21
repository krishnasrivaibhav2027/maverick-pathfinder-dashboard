from mailjet_rest import Client
import random
import string

# Mailjet configuration
MAILJET_API_KEY = "29d464530f14721297b2ff611c3756e7"
MAILJET_API_SECRET = "mail@2027"
SENDER_EMAIL = "gksvaibav99@gmail.com"

# Initialize Mailjet client
mailjet = Client(auth=(MAILJET_API_KEY, MAILJET_API_SECRET), version='v3.1')

def generate_temp_password(length=8):
    """Generate a random temporary password"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def send_welcome_email(user_email, user_name, emp_id, temp_password):
    """Send welcome email with credentials to new user"""
    
    subject = "Welcome to Maverick Pathfinder - Your Account Details"
    
    html_content = f"""
    <html>
    <body>
        <h2>Welcome to Maverick Pathfinder!</h2>
        <p>Hello {user_name},</p>
        <p>Your account has been successfully created. Here are your login credentials:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Account Details:</h3>
            <p><strong>Employee ID:</strong> {emp_id}</p>
            <p><strong>Email:</strong> {user_email}</p>
            <p><strong>Temporary Password:</strong> {temp_password}</p>
        </div>
        
        <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        
        <p>You can now access your personalized training dashboard and begin your learning journey.</p>
        
        <p>Best regards,<br>
        Maverick Pathfinder Team</p>
    </body>
    </html>
    """
    
    text_content = f"""
    Welcome to Maverick Pathfinder!
    
    Hello {user_name},
    
    Your account has been successfully created. Here are your login credentials:
    
    Employee ID: {emp_id}
    Email: {user_email}
    Temporary Password: {temp_password}
    
    Important: Please change your password after your first login for security purposes.
    
    You can now access your personalized training dashboard and begin your learning journey.
    
    Best regards,
    Maverick Pathfinder Team
    """
    
    data = {
        'Messages': [
            {
                "From": {
                    "Email": SENDER_EMAIL,
                    "Name": "Maverick Pathfinder"
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
            return True, "Email sent successfully"
        else:
            return False, f"Failed to send email: {result.status_code}"
    except Exception as e:
        return False, f"Error sending email: {str(e)}" 