import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Bell, LogOut, Rocket, Sun, Moon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const accent = "#FF512F";
const accent2 = "#F09819";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

const getAdminName = () => {
  return localStorage.getItem('admin_name') || 'Admin';
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pendingResumes, setPendingResumes] = useState<{ upload_id: string; filename: string }[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const adminName = getAdminName();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchNotifications = () => {
    fetch("http://localhost:8000/admin/notifications")
      .then(res => res.json())
      .then(data => {
        const resumeNotifications = data.filter(n => n.type === 'resume');
        setPendingResumes(Array.isArray(resumeNotifications) ? resumeNotifications : []);
      })
      .catch(() => setPendingResumes([]));
  };

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const { toast } = useToast();
  // WebSocket for real-time notifications
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isUnmounted = false;

    function connectWS() {
      ws = new WebSocket('ws://localhost:8000/ws/activities');
      ws.onmessage = (event) => {
        try {
          const newActivity = JSON.parse(event.data);
          if (newActivity.type === 'resume_uploaded') {
            fetchNotifications();
            toast({
              title: "New Resume Uploaded",
              description: newActivity.description,
            });
          }
        } catch { /* ignore parse errors */ }
      };
      ws.onclose = () => {
        if (!isUnmounted) {
          reconnectTimeout = setTimeout(connectWS, 5000);
        }
      };
      ws.onerror = () => {
        ws?.close();
      };
    }
    connectWS();
    return () => {
      isUnmounted = true;
      ws?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [toast]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <div className="w-full bg-white py-4 px-0 mb-8 shadow-lg">
        <div className="container mx-auto flex justify-between items-center" style={font}>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-gradient-to-tr from-orange-400 to-orange-500 p-3 shadow-lg">
              <Rocket className="h-7 w-7 text-white" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: accent, letterSpacing: '-0.04em' }}>Admin Dashboard</h1>
              <p className="text-base text-gray-500 font-medium">Mavericks Training Management Portal</p>
              <p className="text-base mt-1 font-semibold" style={{ color: accent2 }}>Welcome, {adminName}!</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  className="rounded-full p-2 bg-white/80 hover:bg-orange-50 shadow border border-orange-100 transition-all relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6 text-orange-400" />
                  {pendingResumes.length > 0 && (
                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="end" sideOffset={8} className="rounded-2xl bg-white/20 shadow-2xl border border-white/40 p-6 min-w-[320px] max-w-xs" style={{ backdropFilter: 'blur(16px)' }}>
                <div className="font-bold text-lg text-orange-500 mb-2">Notifications</div>
                <div className="text-base text-gray-700">
                  {pendingResumes.length > 0 ? (
                    <>
                      A trainee needs to be approved, check the onboarding section
                    </>
                  ) : (
                    <span>No notifications.</span>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              className="rounded-full px-6 py-2 text-base font-semibold shadow-md bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white flex items-center gap-2 transition-all duration-200"
              onClick={() => {
                localStorage.removeItem('empId');
                localStorage.removeItem('is_admin');
                localStorage.removeItem('admin_name');
                navigate('/');
              }} style={font}
            >
              <LogOut className="h-5 w-5" /> Logout
            </Button>
            <Button
              variant="ghost"
              className="ml-2 rounded-full p-2"
              aria-label="Toggle dark mode"
              onClick={() => setDarkMode((d) => !d)}
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-700 dark:text-gray-200" />}
            </Button>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
} 