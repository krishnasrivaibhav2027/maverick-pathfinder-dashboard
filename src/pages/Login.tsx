import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { LogIn, Shield, User } from "lucide-react";
import { sendEmailJs } from "@/lib/emailjs";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (role: "trainee" | "admin") => {

    if (!email) {
      toast({ variant: "destructive", title: "Email is required" });
      return;
    }
    if (role === "trainee" && !password && !name) {
      toast({ variant: "destructive", title: "Full name is required to create an account." });
      return;
    }
    if (role === "admin" && !password) {
      toast({ variant: "destructive", title: "Password is required for admin login" });
      return;
    }

    setIsLoading(true);

    try {
      const requestBody: { email: string; password?: string; role: string; name?: string } = { email, role };
      if (password) requestBody.password = password;
      if (role === "trainee" && !password) {
        requestBody.name = name;
      }
      
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.status === "account_created") {
          toast({ title: "✅ Account Created", description: "Welcome! Check your email for login credentials." });
          if (data.emailData) {
            sendEmailJs(data.emailData).catch(console.error);
          }
          setEmail("");
          setPassword("");
          setName("");
        } else if (data.status === "success") {
          toast({ title: "✅ Login Successful", description: `Welcome back, ${data.user.name}!` });
          if (role === "admin") {
            navigate("/admin-dashboard");
          } else {
            navigate(`/trainee-dashboard/${data.user.empId}`, { state: { user: data.user } });
          }
        }
      } else {
        toast({ variant: "destructive", title: "Login Failed", description: data.detail || "Invalid credentials." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Connection Error", description: "Could not connect to the server." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-center text-slate-800 mb-8 tracking-tighter">
          Mavericks Dashboard
        </h1>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-2">
          <Tabs defaultValue="trainee" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-200/40 rounded-xl p-1.5 h-12 mb-6">
              <TabsTrigger
                value="trainee"
                className="flex items-center justify-center gap-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=inactive]:text-slate-500 rounded-lg transition-all duration-300"
              >
                <User className="h-4 w-4" />
                Trainee
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="flex items-center justify-center gap-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=inactive]:text-slate-500 rounded-lg transition-all duration-300"
              >
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
            </TabsList>

            <div className="px-6 pb-6">
              <TabsContent value="trainee" className="m-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                    <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="h-12 bg-slate-100/80 border-slate-200/80 placeholder:text-slate-400 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 rounded-lg transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainee-email" className="text-sm font-medium text-slate-700">Email Address</Label>
                    <Input id="trainee-email" type="email" placeholder="your.email@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-slate-100/80 border-slate-200/80 placeholder:text-slate-400 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 rounded-lg transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainee-password" className="text-sm font-medium text-slate-700">Password <span className="text-slate-400 font-normal">(for existing users)</span></Label>
                    <Input id="trainee-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-slate-100/80 border-slate-200/80 placeholder:text-slate-400 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 rounded-lg transition-all" />
                  </div>
                </div>
                <div className="mt-6">
                  <Button className="w-full h-12 text-white font-bold rounded-lg shadow-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:ring-4 focus:ring-purple-300/50 transition-all duration-300 transform hover:scale-105" onClick={() => handleLogin("trainee")} disabled={isLoading}>
                    {isLoading ? "Processing..." : "Sign In / Create Account"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="admin" className="m-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-sm font-medium text-slate-700">Admin Email</Label>
                    <Input id="admin-email" type="email" placeholder="admin@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-slate-100/80 border-slate-200/80 placeholder:text-slate-400 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 rounded-lg transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-sm font-medium text-slate-700">Password</Label>
                    <Input id="admin-password" type="password" placeholder="Enter your admin password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-slate-100/80 border-slate-200/80 placeholder:text-slate-400 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 rounded-lg transition-all" />
                  </div>
                </div>
                <div className="mt-6">
                  <Button className="w-full h-12 text-white font-bold rounded-lg shadow-lg bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 focus:ring-4 focus:ring-slate-400/50 transition-all duration-300 transform hover:scale-105" onClick={() => handleLogin("admin")} disabled={isLoading}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {isLoading ? "Authenticating..." : "Access Admin Dashboard"}
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        <footer className="text-center text-sm text-slate-500 mt-8">
          &copy; {new Date().getFullYear()} Hexaware Technologies. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
