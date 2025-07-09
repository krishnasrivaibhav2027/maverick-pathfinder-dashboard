import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Brain, User, ChevronDown, KeyRound, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const accent = "#FF512F";
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

export default function TraineeLayout({ children }: { children: React.ReactNode }) {
  type TraineeState = { name?: string; empId?: string; email?: string; [key: string]: unknown };
  const [traineeState, setTraineeState] = useState<TraineeState>({});
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let trainee = {};
    try {
      trainee = JSON.parse(localStorage.getItem('traineeState') || '{}');
    } catch (e) {
      trainee = {};
    }
    setTraineeState(trainee);
  }, []);

  // Password requirement checks
  const pwChecks = [
    { label: "At least 8 characters", valid: newPassword.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(newPassword) },
    { label: "One number", valid: /[0-9]/.test(newPassword) },
    { label: "One special character", valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) },
  ];
  const allPwChecks = pwChecks.every(c => c.valid);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handlePasswordChange = async () => {
    if (!allPwChecks || !passwordsMatch) {
      setPasswordError("Please match all password requirements.");
      return;
    }
    if (!traineeState.email) {
      setPasswordError("Email is missing. Cannot change password.");
      return;
    }
    setPasswordError("");
    setIsChanging(true);
    try {
      const response = await fetch("http://localhost:8000/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: traineeState.email,
          new_password: newPassword
        }),
      });
      if (response.ok) {
        toast({ title: "✅ Password Changed", description: "Your password has been updated." });
        setShowChangePasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
        // Refetch user data from backend
        const userRes = await fetch(`http://localhost:8000/trainees/email/${traineeState.email}`);
        if (userRes.ok) {
          const updatedUser = await userRes.json();
          setTraineeState(updatedUser);
          localStorage.setItem('traineeState', JSON.stringify(updatedUser));
        }
      } else {
        const errorData = await response.json();
        setPasswordError(Array.isArray(errorData.detail) ? errorData.detail : errorData.detail || "Could not change password.");
      }
    } catch (error) {
      setPasswordError("Could not connect to the server.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #fff7f0 100%)" }}>
      {/* Header */}
      <div className={`w-full ${glass} py-4 px-0 mb-8 fixed top-0 left-0 z-50`} style={{ boxShadow: `0 8px 32px 0 ${accent}22`, width: '100%' }}>
        <div className="container mx-auto flex justify-between items-center" style={font}>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-gradient-to-tr from-orange-400 to-orange-500 p-3 shadow-lg">
              <Brain className="h-7 w-7 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: accent, letterSpacing: '-0.04em' }}>Mavericks Training</h1>
              {traineeState && traineeState.name && <p className="text-base text-gray-500 font-medium">Welcome back, {traineeState.name} ({traineeState.empId})</p>}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full flex items-center gap-2 border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80" style={font}>
                <User className="h-4 w-4" />
                <span>{traineeState?.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl bg-white/80 shadow-lg border border-orange-100 p-2 min-w-[200px]">
              <DropdownMenuLabel className="text-lg font-bold text-gray-900 mb-2">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-orange-100" />
              <DropdownMenuItem
                onClick={() => setShowChangePasswordModal(true)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors text-base text-gray-800 group"
              >
                <KeyRound className="h-5 w-5 text-orange-400 group-hover:text-orange-500 transition" />
                <span>Change Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  localStorage.removeItem('empId');
                  localStorage.removeItem('is_admin');
                  localStorage.removeItem('admin_name');
                  localStorage.removeItem('traineeState');
                  navigate('/');
                }}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors text-base text-gray-800 group"
              >
                <LogOut className="h-5 w-5 text-orange-400 group-hover:text-orange-500 transition" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="container mx-auto px-6 py-8" style={{ paddingTop: '110px' }}>
        {children}
      </div>
      {/* Password change modal rendered globally for layout */}
      {showChangePasswordModal && (
        <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Please enter your new password below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="mt-1 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowNewPassword(v => !v)}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="space-y-1 mt-2">
                  {pwChecks.map((c, i) => (
                    <div key={i} className={`text-sm ${c.valid ? 'text-green-600' : 'text-gray-400'}`}>• {c.label}</div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="mt-1 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPassword(v => !v)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <div className={`text-sm mt-2 ${confirmPassword === newPassword ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {confirmPassword === newPassword ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                {passwordError && <div className="text-red-600 text-sm">{passwordError}</div>}
                {confirmError && <div className="text-red-600 text-sm">{confirmError}</div>}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePasswordChange} disabled={isChanging || !allPwChecks || !passwordsMatch}>
                {isChanging ? 'Changing...' : 'Change Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 