import emailjs from '@emailjs/browser';

interface EmailJSData {
  service_id: string;
  template_id: string;
  user_id: string;
  template_params: Record<string, string>;
}

export async function sendEmailJs(emailData: EmailJSData): Promise<{ success: boolean; message: string }> {
  try {
    console.log('📧 Starting EmailJS send...', emailData);
    
    const { service_id, template_id, user_id, template_params } = emailData;
    
    console.log('📧 EmailJS parameters:', {
      service_id,
      template_id,
      user_id,
      template_params
    });
    
    const result = await emailjs.send(service_id, template_id, template_params, user_id);
    
    console.log('📧 EmailJS result:', result);
    
    if (result.status === 200) {
      console.log('✅ Email sent successfully!');
      return { success: true, message: 'Email sent successfully!' };
    }
    
    console.log('❌ EmailJS error:', result.text);
    return { success: false, message: `EmailJS error: ${result.text}` };
  } catch (error: unknown) {
    console.error('❌ EmailJS exception:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: errorMessage };
  }
}

export async function sendEmailJsDirect(emailData: EmailJSData): Promise<{ success: boolean; message: string }> {
  try {
    console.log('📧 Starting EmailJS direct send...', emailData);
    
    const { service_id, template_id, user_id, template_params } = emailData;
    
    const result = await emailjs.send(service_id, template_id, template_params, user_id);
    
    console.log('📧 EmailJS result:', result);
    
    if (result.status === 200) {
      console.log('✅ Email sent successfully!');
      return { success: true, message: 'Email sent successfully!' };
    }
    
    console.log('❌ EmailJS error:', result.text);
    return { success: false, message: `EmailJS error: ${result.text}` };
  } catch (error: unknown) {
    console.error('❌ EmailJS exception:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: errorMessage };
  }
} 