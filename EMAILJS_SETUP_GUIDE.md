# EmailJS Integration Setup Guide

## Current Status
✅ **Backend**: Correctly preparing email data  
✅ **Frontend**: EmailJS initialized and utility function ready  
❓ **EmailJS Template**: Needs verification

## Step-by-Step Verification

### 1. Check EmailJS Dashboard
1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Verify your service ID: `service_2s0dkxv`
3. Verify your template ID: `template_x2bo3pz`
4. Check your public key: `eaBdGX9iZD0BzCpex`

### 2. Verify EmailJS Template Parameters
Your EmailJS template should expect these parameters:
```javascript
{
  "to_email": "user@example.com",
  "to_name": "User Name", 
  "emp_id": "MAV-0001",
  "temp_password": "TempPass123!",
  "subject": "🎉 Welcome to Maverick Pathfinder - Your Training Journey Begins!",
  "sender_name": "Maverick Pathfinder Training",
  "sender_email": "gksvaibav99@gmail.com",
  "app_url": "http://localhost:8080"
}
```

### 3. Test EmailJS Integration
1. Open your browser to `http://localhost:8080`
2. Open Developer Tools (F12)
3. Go to Console tab
4. Copy and paste this test code:

```javascript
// Test EmailJS directly
emailjs.send('service_2s0dkxv', 'template_x2bo3pz', {
  to_email: 'test@example.com',
  to_name: 'Test User',
  emp_id: 'MAV-0001',
  temp_password: 'TempPass123!',
  subject: '🎉 Welcome to Maverick Pathfinder - Your Training Journey Begins!',
  sender_name: 'Maverick Pathfinder Training',
  sender_email: 'gksvaibav99@gmail.com',
  app_url: 'http://localhost:8080'
}, 'eaBdGX9iZD0BzCpex')
.then(function(response) {
  console.log('✅ Email sent successfully!', response);
}, function(error) {
  console.error('❌ Email failed:', error);
});
```

### 4. Common Issues and Solutions

#### Issue 1: Template Parameters Mismatch
**Problem**: EmailJS template expects different parameter names
**Solution**: Update your EmailJS template to use the parameter names listed above

#### Issue 2: Service/Template ID Incorrect
**Problem**: Service ID or Template ID doesn't exist
**Solution**: Check your EmailJS dashboard and update the IDs in `backend/config.py`

#### Issue 3: Public Key Issues
**Problem**: Public key is invalid or expired
**Solution**: Generate a new public key in EmailJS dashboard

#### Issue 4: CORS Issues
**Problem**: EmailJS requests blocked by CORS
**Solution**: This should work from localhost, but check browser console for CORS errors

### 5. Debug Steps

1. **Check Browser Console** for any JavaScript errors
2. **Verify EmailJS Initialization** - should see no errors when page loads
3. **Test Direct EmailJS Call** using the test code above
4. **Check Network Tab** for failed requests to EmailJS API
5. **Verify Template Syntax** in EmailJS dashboard

### 6. EmailJS Template Example
Your EmailJS template should look something like this:
```html
To: {{to_email}}
From: {{sender_email}}
Subject: {{subject}}

Hello {{to_name}},

Welcome to Maverick Pathfinder Training!

Your login credentials:
Employee ID: {{emp_id}}
Password: {{temp_password}}

Login at: {{app_url}}

Best regards,
{{sender_name}}
```

### 7. Testing the Complete Flow
1. Go to `http://localhost:8080`
2. Enter a name and email for a new trainee
3. Click "Login" (this will create the account)
4. Check browser console for logs:
   - `📧 Account created, checking for email data...`
   - `📧 Email data received from backend:`
   - `📧 Starting EmailJS send...`
   - `📧 Email sending result:`

### 8. If Still Not Working
1. Check EmailJS dashboard for any error messages
2. Verify your EmailJS account is active
3. Check if you have any email sending limits
4. Try with a different email address
5. Check if your EmailJS service is properly configured

## Quick Fix Commands
If you need to update EmailJS configuration:

```bash
# Update config.py with new EmailJS credentials
# Then restart the backend server
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Support
If you're still having issues:
1. Check EmailJS documentation: https://www.emailjs.com/docs/
2. Verify your EmailJS account status
3. Check browser console for specific error messages 