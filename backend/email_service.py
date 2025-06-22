"""
Email service using EmailJS for Maverick Pathfinder Dashboard
Note: EmailJS requires frontend integration as it doesn't allow server-side API calls
"""

import json
from typing import Dict, Any, Tuple
from .config import settings

def validate_emailjs_config():
    """Validate EmailJS configuration"""
    print("🔧 Validating EmailJS configuration...")
    
    # Print debug info
    settings.print_config_debug()
    
    # Validate configuration
    is_valid, message = settings.validate_emailjs_config()
    if not is_valid:
        print(f"❌ Configuration Error: {message}")
        return False, message
    
    print("✅ EmailJS configuration is valid")
    return True, "Configuration valid"

def prepare_welcome_email_data(user_email: str, user_name: str, emp_id: str, temp_password: str) -> Dict[str, Any]:
    """Prepare welcome email data for frontend EmailJS integration"""
    
    try:
        # Validate configuration first
        is_valid, message = validate_emailjs_config()
        if not is_valid:
            return {"error": message}
        
        print(f"📧 Preparing EmailJS email data for {user_email}")
        
        # Prepare the email data for frontend
        email_data = {
            "service_id": settings.EMAILJS_SERVICE_ID,
            "template_id": settings.EMAILJS_TEMPLATE_ID,
            "user_id": settings.EMAILJS_PUBLIC_KEY,
            "template_params": {
                "to_email": user_email,
                "to_name": user_name,
                "emp_id": emp_id,
                "temp_password": temp_password,
                "subject": settings.WELCOME_EMAIL_SUBJECT,
                "sender_name": settings.SENDER_NAME,
                "sender_email": settings.SENDER_EMAIL,
                "app_url": "http://localhost:8080"
            }
        }
        
        print(f"✅ Email data prepared successfully for {user_email}")
        return email_data
        
    except Exception as e:
        error_msg = f"Error preparing email data: {str(e)}"
        print(f"❌ {error_msg}")
        return {"error": error_msg}

def prepare_password_reset_email_data(user_email: str, user_name: str, reset_token: str) -> Dict[str, Any]:
    """Prepare password reset email data for frontend EmailJS integration"""
    
    try:
        # Validate configuration first
        is_valid, message = validate_emailjs_config()
        if not is_valid:
            return {"error": message}
        
        print(f"📧 Preparing password reset email data for {user_email}")
        
        # Prepare the email data for frontend
        email_data = {
            "service_id": settings.EMAILJS_SERVICE_ID,
            "template_id": "template_password_reset",  # You'll need to create this template
            "user_id": settings.EMAILJS_PUBLIC_KEY,
            "template_params": {
                "to_email": user_email,
                "to_name": user_name,
                "reset_token": reset_token,
                "subject": settings.PASSWORD_RESET_SUBJECT,
                "sender_name": settings.SENDER_NAME,
                "sender_email": settings.SENDER_EMAIL,
                "reset_url": f"http://localhost:8080/reset-password?token={reset_token}"
            }
        }
        
        print(f"✅ Password reset email data prepared successfully for {user_email}")
        return email_data
        
    except Exception as e:
        error_msg = f"Error preparing password reset email data: {str(e)}"
        print(f"❌ {error_msg}")
        return {"error": error_msg}

def test_emailjs_connection():
    """Test EmailJS configuration (no actual connection test possible from backend)"""
    try:
        print("🔧 Testing EmailJS configuration...")
        
        # Validate configuration first
        is_valid, message = validate_emailjs_config()
        if not is_valid:
            return False, message
        
        print("✅ EmailJS configuration is valid")
        print("ℹ️  Note: EmailJS requires frontend integration for actual sending")
        return True, "EmailJS configuration valid (frontend integration required)"
        
    except Exception as e:
        return False, f"Unexpected error testing EmailJS: {e}"

# Standalone test function
def run_email_test():
    """Run comprehensive EmailJS system test"""
    print("🧪 Starting comprehensive EmailJS system test...")
    
    # Test 1: Configuration validation
    success, message = validate_emailjs_config()
    if not success:
        print(f"❌ Test 1 Failed: {message}")
        return
    print("✅ Test 1 Passed: Configuration validation")
    
    # Test 2: EmailJS configuration
    success, message = test_emailjs_connection()
    if not success:
        print(f"❌ Test 2 Failed: {message}")
        return
    print("✅ Test 2 Passed: EmailJS configuration")
    
    # Test 3: Prepare test email data
    test_email = input("Enter test email address (or press Enter to skip): ").strip()
    if test_email:
        email_data = prepare_welcome_email_data(
            test_email, 
            "Test User", 
            "TEST001", 
            "TempPass123"
        )
        if "error" not in email_data:
            print("✅ Test 3 Passed: Email data prepared successfully")
            print(f"📧 Email data: {json.dumps(email_data, indent=2)}")
        else:
            print(f"❌ Test 3 Failed: {email_data['error']}")
    
    print("🎉 EmailJS system test completed!")
    print("ℹ️  Remember: EmailJS requires frontend integration for actual sending")

if __name__ == "__main__":
    run_email_test()
