import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Brain, User, ChevronDown, KeyRound, LogOut } from "lucide-react";

const accent = "#FF512F";
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

export default function TraineeLayout({ children }: { children: React.ReactNode }) {
  type TraineeState = { name?: string; empId?: string; [key: string]: unknown };
  const [traineeState, setTraineeState] = useState<TraineeState>({});
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    let trainee = {};
    try {
      trainee = JSON.parse(localStorage.getItem('traineeState') || '{}');
    } catch (e) {
      trainee = {};
    }
    setTraineeState(trainee);
  }, []);

  const navigate = (window as { navigate?: (...args: unknown[]) => void }).navigate || (() => {}); // fallback if not using useNavigate
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
                  if (navigate) navigate('/');
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
      {/* Password change modal can be implemented here if needed, using showChangePasswordModal */}
    </div>
  );
} 