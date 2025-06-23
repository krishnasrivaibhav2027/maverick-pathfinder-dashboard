import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { sendEmailJs } from "@/lib/emailjs";

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper to detect role from Employee-ID
  const detectRole = (empId: string) => {
    if (empId.startsWith("MAV-")) return "trainee";
    if (empId.startsWith("ADM-")) return "admin";
    // Default fallback (could be improved)
    return "trainee";
  };

  const handleLogin = async () => {
    if (!empId || !password) {
      toast({ variant: "destructive", title: "Employee-ID and Password are required" });
      return;
    }
    setIsLoading(true);
    const role = detectRole(empId);
    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId, password, role }),
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        toast({ title: "✅ Login Successful", description: `Welcome back, ${data.user.name}!` });
        if (role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate(`/trainee-dashboard/${data.user.empId}`, { state: { user: data.user } });
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

  const handleSignup = async () => {
    if (!name || !email) {
      toast({ variant: "destructive", title: "Name and Email are required" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role: "trainee" }),
      });
      const data = await response.json();
      if (response.ok && data.status === "account_created") {
        // Send welcome email using EmailJS if emailData is present
        if (data.emailData) {
          const emailResult = await sendEmailJs(data.emailData);
          if (!emailResult.success) {
            toast({ variant: "destructive", title: "Account created, but email failed to send.", description: emailResult.message });
          }
        }
        toast({ title: "✅ Account Created", description: "Check your email for login credentials." });
        setTab('login');
        setName("");
        setEmail("");
      } else {
        toast({ variant: "destructive", title: "Signup Failed", description: data.detail || "Could not create account." });
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
          <div className="px-6 pb-6 pt-8">
            {tab === 'login' ? (
              <>
                <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="empid" className="text-sm font-medium text-slate-700">Employee-ID</Label>
                    <Input id="empid" type="text" placeholder="e.g. MAV-0001 or ADM-0001" value={empId} onChange={e => setEmpId(e.target.value)} className="h-12 bg-slate-100/80 border-slate-200/80 placeholder:text-slate-400 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 rounded-lg transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                    <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 bg-slate-100/80 border-slate-200/80 placeholder:text-slate-400 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 rounded-lg transition-all" />
                  </div>
                </div>
                <div className="mt-6">
                  <Button className="w-full h-12 text-white font-bold rounded-lg shadow-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:ring-4 focus:ring-purple-300/50 transition-all duration-300 transform hover:scale-105" onClick={handleLogin} disabled={isLoading}>
                    {isLoading ? "Processing..." : "Login"}
                  </Button>
                </div>
                <div className="text-center mt-4 text-sm text-slate-600">
                  Don't have an account?{' '}
                  <button className="text-purple-600 hover:underline font-semibold" onClick={() => setTab('signup')}>
                    Create account
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-center mb-6">Sign Up</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                    <Input id="name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="h-12 bg-slate-100/80 border-slate-200/80 placeholder:text-slate-400 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 rounded-lg transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium text-slate-700">Email Address</Label>
                    <Input id="signup-email" type="email" placeholder="your.email@company.com" value={email} onChange={e => setEmail(e.target.value)} className="h-12 bg-slate-100/80 border-slate-200/80 placeholder:text-slate-400 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 rounded-lg transition-all" />
                  </div>
                </div>
                <div className="mt-6">
                  <Button className="w-full h-12 text-white font-bold rounded-lg shadow-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:ring-4 focus:ring-purple-300/50 transition-all duration-300 transform hover:scale-105" onClick={handleSignup} disabled={isLoading}>
                    {isLoading ? "Processing..." : "Sign Up"}
                  </Button>
                </div>
                <div className="text-center mt-4 text-sm text-slate-600">
                  Already have an account?{' '}
                  <button className="text-purple-600 hover:underline font-semibold" onClick={() => setTab('login')}>
                    Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <footer className="text-center text-sm text-slate-500 mt-8">
          &copy; {new Date().getFullYear()} Hexaware Technologies. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
