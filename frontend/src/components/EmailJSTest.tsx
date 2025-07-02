import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendEmailJs } from '@/lib/emailjs';

export function EmailJSTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testEmailJS = async () => {
    setIsLoading(true);
    setResult('Testing EmailJS...');

    try {
      const testData = {
        service_id: 'service_2s0dkxv',
        template_id: 'template_x2bo3pz',
        user_id: 'eaBdGX9iZD0BzCpex',
        template_params: {
          to_email: 'test@example.com',
          to_name: 'Test User',
          emp_id: 'MAV-0001',
          temp_password: 'TempPass123!',
          subject: '🎉 Welcome to Maverick Pathfinder - Your Training Journey Begins!',
          sender_name: 'Maverick Pathfinder Training',
          sender_email: 'gksvaibav99@gmail.com',
          app_url: 'http://localhost:8080'
        }
      };

      const emailResult = await sendEmailJs(testData);
      
      if (emailResult.success) {
        setResult('✅ Email sent successfully!');
      } else {
        setResult(`❌ Email failed: ${emailResult.message}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>EmailJS Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testEmailJS} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test EmailJS'}
        </Button>
        
        {result && (
          <div className={`p-3 rounded ${
            result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {result}
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p>This will send a test email using EmailJS.</p>
          <p>Check the browser console for detailed logs.</p>
        </div>
      </CardContent>
    </Card>
  );
} 