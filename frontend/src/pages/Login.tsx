import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { sendEmailJs } from "@/lib/emailjs";
import { Rocket } from 'lucide-react';

const accent = "#FF512F";
const accent2 = "#F09819";
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!empId || !password) {
      toast({ variant: "destructive", title: "Employee ID and Password are required" });
      return;
    }
    setIsLoading(true);
    try {
      // Try as trainee first
      let payload = {
        empId,
        password,
        role: "trainee"
      };
      console.log("Login request payload (trainee):", payload);
      let response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = await response.json();
      console.log("Backend response (trainee):", data);
      if (response.ok && data.access_token) {
        toast({ title: "✅ Login Successful" });
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('role', data.role);
        if (data.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate(`/trainee-dashboard/${empId}`);
        }
        return;
      }
      // If not found or invalid, try as admin
      payload = {
        empId,
        password,
        role: "admin"
      };
      console.log("Login request payload (admin):", payload);
      response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      data = await response.json();
      console.log("Backend response (admin):", data);
      if (response.ok && data.access_token) {
        toast({ title: "✅ Login Successful" });
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('role', data.role);
        if (data.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate(`/trainee-dashboard/${empId}`);
        }
        return;
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail) || "Invalid credentials."
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Connection Error", description: "Could not connect to the server." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !empId || !signupPassword) {
      toast({ variant: "destructive", title: "Name, Employee ID, and Password are required" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, empId, password: signupPassword, role: "trainee" }),
      });
      const data = await response.json();
      if (response.ok && data.id) {
        toast({ title: "✅ Account Created", description: "You can now log in with your credentials." });
        setTab('login');
        setName("");
        setEmpId("");
        setSignupPassword("");
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
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #fff7f0 100%)" }}>
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center mb-10">
          <span className="mb-2">
            <Rocket style={{ color: accent, fontSize: 48, filter: 'drop-shadow(0 4px 16px #ff512f44)' }} />
          </span>
          <h1
            className="text-center"
            style={{
              fontFamily: 'Inter, ui-rounded, system-ui, sans-serif',
              fontWeight: 900,
              fontSize: '3.2rem',
              lineHeight: 1.1,
              background: 'linear-gradient(90deg, #FF512F, #F09819)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 24px #ff512f33',
              letterSpacing: '-0.04em',
              marginBottom: 0
            }}
          >
            <span style={{ display: 'block', fontWeight: 800 }}>Mavericks</span>
            <span style={{ display: 'block', fontWeight: 900, fontSize: '1.2em', marginTop: '-0.2em' }}>Dashboard</span>
          </h1>
        </div>
        <div className={`relative ${glass} rounded-3xl p-2`} style={{ boxShadow: `0 8px 32px 0 ${accent}22` }}>
          {/* Tabs */}
          <div className="flex justify-center gap-4 mb-6 mt-4">
            <button
              className={`px-8 py-3 rounded-full font-semibold text-lg shadow-md border-2 transition-all duration-200 ${tab === 'login' ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white border-orange-400 scale-105' : 'bg-white/80 text-orange-500 border-orange-200 hover:bg-orange-50 hover:scale-105'}`}
              style={font}
              onClick={() => setTab('login')}
            >
              Login
            </button>
            <button
              className={`px-8 py-3 rounded-full font-semibold text-lg shadow-md border-2 transition-all duration-200 ${tab === 'signup' ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white border-orange-400 scale-105' : 'bg-white/80 text-orange-500 border-orange-200 hover:bg-orange-50 hover:scale-105'}`}
              style={font}
              onClick={() => setTab('signup')}
            >
              Sign Up
            </button>
          </div>
          <div className="px-8 pb-8 pt-4">
            {tab === 'login' ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-empid" className="text-sm font-medium" style={{ color: '#444', ...font }}>Employee ID</Label>
                    <Input id="login-empid" type="text" placeholder="Enter your Employee ID" value={empId} onChange={e => setEmpId(e.target.value)} className="h-12 bg-gray-100/80 border-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-300/60 rounded-xl shadow-inner transition-all" style={font} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium" style={{ color: '#444', ...font }}>Password</Label>
                    <Input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 bg-gray-100/80 border-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-300/60 rounded-xl shadow-inner transition-all" style={font} />
                  </div>
                </div>
                <div className="mt-8">
                  <Button className="w-full h-12 text-white font-bold rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 focus:ring-4 focus:ring-orange-300/50 transition-all duration-300 transform hover:scale-105" style={font} onClick={handleLogin} disabled={isLoading}>
                    {isLoading ? "Processing..." : "Log In"}
                  </Button>
                </div>
                <div className="text-center mt-6 text-base" style={{ color: '#888', ...font }}>
                  Don't have an account?{' '}
                  <button className="text-orange-500 hover:underline font-semibold transition" onClick={() => setTab('signup')}>
                    Create account
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium" style={{ color: '#444', ...font }}>Full Name</Label>
                    <Input id="name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="h-12 bg-gray-100/80 border-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-300/60 rounded-xl shadow-inner transition-all" style={font} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-empid" className="text-sm font-medium" style={{ color: '#444', ...font }}>Employee ID</Label>
                    <Input id="signup-empid" type="text" placeholder="Enter your Employee ID" value={empId} onChange={e => setEmpId(e.target.value)} className="h-12 bg-gray-100/80 border-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-300/60 rounded-xl shadow-inner transition-all" style={font} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium" style={{ color: '#444', ...font }}>Password</Label>
                    <Input id="signup-password" type="password" placeholder="Create a password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="h-12 bg-gray-100/80 border-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-300/60 rounded-xl shadow-inner transition-all" style={font} />
                  </div>
                </div>
                <div className="mt-8">
                  <Button className="w-full h-12 text-white font-bold rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 focus:ring-4 focus:ring-orange-300/50 transition-all duration-300 transform hover:scale-105" style={font} onClick={handleSignup} disabled={isLoading}>
                    {isLoading ? "Processing..." : "Sign Up"}
                  </Button>
                </div>
                <div className="text-center mt-6 text-base" style={{ color: '#888', ...font }}>
                  Already have an account?{' '}
                  <button className="text-orange-500 hover:underline font-semibold transition" onClick={() => setTab('login')}>
                    Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <footer className="text-center text-sm text-gray-400 mt-8" style={font}>
          &copy; {new Date().getFullYear()} Hexaware Technologies. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
