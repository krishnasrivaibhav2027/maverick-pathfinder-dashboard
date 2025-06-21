import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Brain, Mail, Lock, User, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

    // For new trainees, password is optional (they'll get it via email)
    if (role === 'admin' && !password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your password.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.status === 'created') {
          toast({
            title: "Account Created Successfully!",
            description: data.email_sent 
              ? "Welcome! Your account has been created and credentials sent to your email." 
              : "Account created but email delivery failed. Please contact support.",
          });
          
          // For new trainees, show a message about checking email
          if (data.email_sent) {
            toast({
              title: "Check Your Email",
              description: "Your Employee ID and temporary password have been sent to your email address.",
            });
          }
        } else {
          toast({
            title: "Login Successful",
            description: "Redirecting to your dashboard...",
          });
        }

        if (role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          const empId = data.user.empId;
          navigate(`/trainee-dashboard/${empId}`);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.detail || "Invalid credentials. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: "Could not connect to the server. Please try again later.",
      });
    } finally {
      setIsLoading(false);
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
          <p className="text-sm opacity-90">Intelligent user onboarding system</p>
        </div>

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
                <CardTitle className="text-2xl font-bold text-gray-900">Trainee Login</CardTitle>
                <CardDescription>
                  New trainees: Just enter your email. Existing trainees: Use your credentials.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trainee-email">Email</Label>
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
                    placeholder="Your password (if existing user)" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleLogin('trainee')}
                  disabled={isLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" /> 
                  {isLoading ? "Processing..." : "Sign In / Create Account"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">Admin Portal</CardTitle>
                <CardDescription>Manage trainees and training content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
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
                    placeholder="Admin password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleLogin('admin')}
                  disabled={isLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" /> 
                  {isLoading ? "Processing..." : "Access Admin Dashboard"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
