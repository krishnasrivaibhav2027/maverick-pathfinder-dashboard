import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Brain, Mail, Lock, User, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendEmailJs } from "@/lib/emailjs";
import { EmailJSTest } from "@/components/EmailJSTest";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewUserInfo, setShowNewUserInfo] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (role: 'trainee' | 'admin') => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your email address.",
      });
      return;
    }

    // For admin, password is required
    if (role === 'admin' && !password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Admin login requires a password.",
      });
      return;
    }

    // For new trainees, name is required
    if (role === 'trainee' && !password && !name) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your name for new account creation.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const requestBody = { 
        email, 
        password, 
        role,
        ...(role === 'trainee' && !password && name && { name }) // Include name only for new trainees
      };

      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.status === 'account_created') {
          // New user account has been created. Send welcome email and show success message.
          console.log('📧 Account created, checking for email data...', data);
          
          if (data.emailData) {
            console.log('📧 Email data received from backend:', data.emailData);
            try {
              const emailResult = await sendEmailJs(data.emailData);
              console.log('📧 Email sending result:', emailResult);
              
              if (emailResult.success) {
                toast({
                  title: "✅ Account Created & Email Sent",
                  description: "Account created successfully! Check your email for login credentials.",
                  duration: 5000,
                });
              } else {
                toast({
                  title: "✅ Account Created",
                  description: `Account created, but email sending failed: ${emailResult.message}`,
                  duration: 5000,
                });
              }
            } catch (emailError) {
              console.error("Email sending error:", emailError);
              toast({
                title: "✅ Account Created",
                description: "Account created, but email sending failed. Please contact support.",
                duration: 5000,
              });
            }
          } else {
            console.log('❌ No email data received from backend');
            toast({
              title: "✅ Account Created",
              description: data.message || "Please check your email for login credentials.",
              duration: 5000,
            });
          }
          // Clear form fields
          setEmail("");
          setPassword("");
          setName("");
        } else if (data.status === 'success') {
          // Existing user login was successful
          toast({
            title: "✅ Login Successful",
            description: `Welcome back, ${data.user.name}!`,
          });

          if (role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            const empId = data.user.empId;
            navigate(`/trainee-dashboard/${empId}`);
          }
        }
      } else {
        // Handle specific error messages
        let errorMessage = data.detail || "Invalid credentials. Please try again.";
        
        // Special handling for existing users without password
        if (data.detail && data.detail.includes("User already exists")) {
          errorMessage = "This email is already registered. Please enter your password to login.";
        }
        
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not connect to the server. Please check if the backend is running and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address first.",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password Reset Sent",
          description: "A new password has been sent to your email address.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: data.detail || "Could not reset password.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not process password reset request.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-white p-4 rounded-full shadow-lg">
            <Brain className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mt-4">Maverick Pathfinder</h1>
          <p className="text-sm opacity-90">AI-Powered Training Platform</p>
        </div>

        {showNewUserInfo && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Account Created!</strong> Check your email for login credentials. You'll be redirected to your dashboard shortly.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="trainee" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="trainee" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Trainee
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="trainee">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">Trainee Portal</CardTitle>
                <CardDescription>
                  <strong>New trainees:</strong> Enter your name and email - we'll create your account automatically!<br/>
                  <strong>Existing trainees:</strong> Use your email and password from the welcome email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trainee-name">Full Name (Required for new users)</Label>
                  <Input 
                    id="trainee-name" 
                    type="text" 
                    placeholder="Enter your full name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trainee-email">Email Address</Label>
                  <Input 
                    id="trainee-email" 
                    type="email" 
                    placeholder="your.email@company.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trainee-password">Password (Optional for new users)</Label>
                  <Input 
                    id="trainee-password" 
                    type="password" 
                    placeholder="Enter password if you're an existing user" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
                
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>First time here?</strong> Our AI will generate your credentials and email them to you instantly!
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button 
                  className="w-full" 
                  onClick={() => handleLogin('trainee')}
                  disabled={isLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" /> 
                  {isLoading ? "Processing..." : "Sign In / Create Account"}
                </Button>
                
                {password && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handlePasswordReset}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Forgot Password?
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">Admin Portal</CardTitle>
                <CardDescription>Access the administrative dashboard to manage trainees and training programs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input 
                    id="admin-email" 
                    type="email" 
                    placeholder="admin@company.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input 
                    id="admin-password" 
                    type="password" 
                    placeholder="Enter your admin password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
                
                <Alert className="border-amber-200 bg-amber-50">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Admin access requires valid credentials. Contact IT support if you need assistance.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleLogin('admin')}
                  disabled={isLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" /> 
                  {isLoading ? "Authenticating..." : "Access Admin Dashboard"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* EmailJS Test Component - Remove after testing */}
        <div className="mt-8">
          <EmailJSTest />
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>🤖 Powered by AI • 🔒 Secure Authentication • 📧 Automated Onboarding</p>
        </div>
      </div>
    </div>
  );
};

export default Login;