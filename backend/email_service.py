
from mailersend import emails, domains
from config import settings

def send_welcome_email(user_email, user_name, emp_id, temp_password):
    """Send welcome email with credentials using a MailerSend template."""
    
    # Initialize the MailerSend new email object
    mailer = emails.NewEmail(settings.MAILERSEND_API_KEY)

    # Define an empty dict to populate with mail values
    mail_body = {}

    # Define sender
    mail_from = {
        "name": settings.SENDER_NAME,
        "email": settings.SENDER_EMAIL,
    }

    # Define recipients
    recipients = [
        {
            "name": user_name,
            "email": user_email,
        }
    ]

    # Define personalization data for the template
    personalization = [
        {
            "email": user_email,
            "data": {
                "emp_id": emp_id,
                "name": user_name,
                "password": temp_password,
                "company": "Maverick Pathfinder"
            }
        }
    ]

    # Set up the email parameters
    mailer.set_mail_from(mail_from, mail_body)
    mailer.set_mail_to(recipients, mail_body)
    mailer.set_subject("Your New Maverick Pathfinder Account Credentials", mail_body)
    mailer.set_template(settings.MAILERSEND_TEMPLATE_ID, mail_body)
    mailer.set_personalization(personalization, mail_body)

    try:
        # Send the email
        response = mailer.send(mail_body)
        print(f"✅ Welcome email sent successfully to {user_email}. Response: {response}")
        return True, "Email sent successfully"
    except Exception as e:
        print(f"❌ Error sending email via MailerSend API: {str(e)}")
        return False, f"Error sending email: {str(e)}"

def test_mailersend_connection():
    """Test the MailerSend API connection by trying to fetch domains."""
    try:
        domain_service = domains.NewDomain(settings.MAILERSEND_API_KEY)
        domain_service.get_domains()
        return True, "MailerSend API connection successful (authentication ok)."
    except Exception as e:
        if "401" in str(e) or "Unauthorized" in str(e):
             return False, "MailerSend API connection failed: Invalid API Key."
        return False, f"MailerSend API connection failed: {str(e)}"
