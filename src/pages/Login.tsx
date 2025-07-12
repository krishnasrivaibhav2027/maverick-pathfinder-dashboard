import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { sendEmailJs } from "@/lib/emailjs";
import { Rocket, Eye, EyeOff } from 'lucide-react';

const accent = "#FF512F";
const accent2 = "#F09819";
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

// Helper to get JWT token
function getToken() {
  return localStorage.getItem("access_token");
}

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup' | 'wait_approval'>('login');
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [signupEmpId, setSignupEmpId] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    try {
      const formData = new URLSearchParams();
      formData.append("username", empId); // username is empId or email
      formData.append("password", password);
      // Use new JWT endpoint
      const response = await fetch("http://localhost:8000/api/v2/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      const data = await response.json();
      if (response.ok && data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        toast({ title: "✅ Login Successful", description: `Welcome back!` });
        // Fetch user profile using token
        const profileRes = await fetch(`http://localhost:8000/api/v2/trainees/${empId}`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const user = await profileRes.json();
        if (user && user.empId) {
          localStorage.setItem("empId", user.empId);
          navigate(`/trainee-dashboard/${user.empId}`, { state: { user } });
        } else {
          toast({ variant: "destructive", title: "Login Failed", description: "Could not fetch user profile." });
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
      const response = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();
      if (response.ok && data.status === "account_created") {
        toast({ title: "✅ Account Created", description: data.message });
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
                    <Label htmlFor="empid" className="text-sm font-medium" style={{ color: '#444', ...font }}>Employee-ID</Label>
                    <Input id="empid" type="text" placeholder="e.g. MAV-0001 or ADM-0001" value={empId} onChange={e => setEmpId(e.target.value)} className="h-12 bg-gray-100/80 border-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-300/60 rounded-xl shadow-inner transition-all" style={font} onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#444', ...font }}>Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="h-12 bg-gray-100/80 border-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-300/60 rounded-xl shadow-inner transition-all pr-12"
                        style={font}
                        onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword(v => !v)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
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
                <div className="space-y-6 flex flex-col items-center">
                  {/* Download Resume Template */}
                  <a
                    href="/student-template-v3.doc"
                    download
                    className="w-full"
                  >
                    <Button className="w-full h-12 text-white font-bold rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 focus:ring-4 focus:ring-orange-300/50 transition-all duration-300 transform hover:scale-105" style={font}>
                      Download Resume Template
                    </Button>
                  </a>
                  <div className="text-sm text-gray-600 text-center max-w-md">
                    Please download the template, fill it out, and upload it <b>as a PDF</b>.
                  </div>
                  {/* Upload Resume */}
                  <input
                    type="file"
                    accept=".pdf"
                    className="w-full border border-orange-200 rounded-xl p-3 bg-gray-100/80 focus:bg-white focus:ring-2 focus:ring-orange-300/60 shadow-inner transition-all"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsLoading(true);
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const response = await fetch('http://localhost:8000/signup/upload-resume', {
                          method: 'POST',
                          body: formData,
                        });
                        const data = await response.json();
                        if (response.ok && data.status === 'pending_approval') {
                          toast({ title: 'Resume Uploaded', description: 'Wait for admin approval to receive credentials.' });
                          setTab('wait_approval');
                        } else {
                          let errorMsg = data.detail;
                          if (!errorMsg && Array.isArray(data)) errorMsg = data.map(e => e.msg).join(', ');
                          if (!errorMsg && typeof data === 'object') errorMsg = JSON.stringify(data);
                          toast({ variant: 'destructive', title: 'Upload Failed', description: errorMsg || 'Could not upload resume.' });
                        }
                      } catch (error) {
                        toast({ variant: 'destructive', title: 'Connection Error', description: 'Could not connect to the server.' });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                  />
                  {/* Status message for waiting approval */}
                  {tab === 'wait_approval' && (
                    <div className="text-center mt-6 text-base text-orange-500 font-semibold">
                      Wait for admin approval to receive your credentials.
                    </div>
                  )}
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
