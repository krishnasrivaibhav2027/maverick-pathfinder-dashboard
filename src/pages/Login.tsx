
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Brain, Mail, Lock, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (userType: 'trainee' | 'admin') => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Simulate AI agent check for new user
    if (email.includes('new') || isNewUser) {
      toast({
        title: "AI Agent Activated",
        description: "New user detected! Temporary credentials sent to your email.",
        className: "bg-blue-50 border-blue-200 text-blue-800",
      });
      setTimeout(() => {
        toast({
          title: "Welcome to Mavericks!",
          description: "Your Employee ID: MAV-2024-001. Please check your email for temporary password.",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }, 2000);
    }

    setTimeout(() => {
      if (userType === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/trainee-dashboard');
      }
    }, 3000);
  };

  const simulateNewUserDetection = () => {
    setIsNewUser(true);
    toast({
      title: "AI Agent Processing",
      description: "Analyzing user profile... New user detected!",
      className: "bg-purple-50 border-purple-200 text-purple-800",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* AI Agent Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 mb-6 text-white text-center shadow-lg">
          <Brain className="h-8 w-8 mx-auto mb-2 animate-pulse" />
          <h2 className="text-lg font-semibold">AI Training Agent</h2>
          <p className="text-sm opacity-90">Intelligent user onboarding system</p>
        </div>

        <Tabs defaultValue="trainee" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
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
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Trainee Login</CardTitle>
                <CardDescription>
                  Access your personalized training dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={() => handleLogin('trainee')}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl"
                >
                  Sign In to Dashboard
                </Button>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={simulateNewUserDetection}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    New Employee? Click here for AI assistance
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Admin Portal</CardTitle>
                <CardDescription>
                  Monitor and manage all training programs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Admin password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={() => handleLogin('admin')}
                  className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white font-semibold rounded-xl"
                >
                  Access Admin Dashboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Features Highlight */}
        <div className="mt-6 bg-white/50 backdrop-blur-sm rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600 mb-2">✨ AI-Powered Features</p>
          <div className="flex justify-center gap-4 text-xs text-gray-500">
            <span>• Auto User Detection</span>
            <span>• Credential Generation</span>
            <span>• Smart Training Paths</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
