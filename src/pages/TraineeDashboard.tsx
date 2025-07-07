import React from "react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Brain, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Lock, 
  Download,
  BarChart3,
  Target,
  Calendar,
  User,
  LogOut,
  ChevronDown,
  KeyRound,
  ChevronRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Fragment } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import dayjs from 'dayjs';

const accent = "#FF512F";
const accent2 = "#F09819";
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

const TraineeDashboard = () => {
  const navigate = useNavigate();
  const { empId } = useParams();
  const location = useLocation();
  const trainee = location.state?.user;
  const { toast } = useToast();

  const [selectedPhase, setSelectedPhase] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState({ 1: false, 2: false });
  const [contentHeight, setContentHeight] = useState({ phase1: "0px" });
  const contentRefs = {
    phase1: useRef(null)
  };

  const [activeTab, setActiveTab] = useState('overview');

  const [traineeState, setTrainee] = useState(trainee);
  const [tasks, setTasks] = useState([]);

  // Dynamically generate Phase 1 trainings based on trainee skill
  function getPhaseOneTrainings(skill: string) {
    const common = [
      { id: 1, title: "Programming Fundamentals", status: "completed", progress: 100 },
      { id: 2, title: "Object-Oriented Programming (OOP) Concepts", status: "pending", progress: 0 },
      { id: 3, title: "Version Control with Git & GitHub", status: "pending", progress: 0 },
      { id: 4, title: "Database Fundamentals", status: "pending", progress: 0 },
      { id: 5, title: "Software Development Lifecycle & Agile Basics", status: "pending", progress: 0 },
      { id: 6, title: "Basic Data Structures & Algorithms", status: "pending", progress: 0 },
      { id: 7, title: "Debugging & Problem Solving", status: "pending", progress: 0 },
    ];
    const python = [
      { id: 101, title: "Python Programming Essentials", status: "pending", progress: 0 },
      { id: 102, title: "Intro to Python Libraries (NumPy, Pandas, Requests, Matplotlib)", status: "pending", progress: 0 },
    ];
    const java = [
      { id: 201, title: "Java Programming Essentials", status: "pending", progress: 0 },
      { id: 202, title: "Intro to Java Libraries (Standard Library, JUnit)", status: "pending", progress: 0 },
    ];
    const dotnet = [
      { id: 301, title: "C# Programming Essentials", status: "pending", progress: 0 },
      { id: 302, title: "Intro to .NET Libraries (LINQ, File I/O, NUnit/xUnit)", status: "pending", progress: 0 },
    ];
    if (skill?.toLowerCase().includes("python")) return [...common, ...python];
    if (skill?.toLowerCase().includes("java")) return [...common, ...java];
    if (skill?.toLowerCase().includes(".net")) return [...common, ...dotnet];
    return common;
  }
  const phaseOneTrainings = getPhaseOneTrainings(traineeState.specialization);

  const phaseTwoTrainings = [
    { id: 5, title: "Advanced Backend Development", status: "pending", progress: 0 },
    { id: 6, title: "Cloud Architecture", status: "pending", progress: 0 },
    { id: 7, title: "System Design", status: "pending", progress: 0 },
    { id: 8, title: "DevOps and CI/CD", status: "pending", progress: 0 }
  ];

  const [progressData, setProgressData] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  const POLL_INTERVAL = 300000; // 5 minutes in ms

  const [jwt, setJwt] = useState(""); // Assume JWT is set on login and available here

  // Password requirement checks
  const pwChecks = [
    { label: "At least 8 characters", valid: newPassword.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(newPassword) },
    { label: "One number", valid: /[0-9]/.test(newPassword) },
    { label: "One special character", valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) },
  ];
  const allPwChecks = pwChecks.every(c => c.valid);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  useEffect(() => {
    let isMounted = true;
    const intervalId = setInterval(fetchChartData, POLL_INTERVAL);

    async function fetchChartData() {
      try {
        // Fetch Weekly Progress
        const progressRes = await fetch('http://localhost:8000/batches/weekly-progress');
        const progressJson = await progressRes.json();
        // Find this trainee's batch (by empId)
        let traineeBatch = null;
        for (const batch of progressJson) {
          if (batch.trainees && batch.trainees.some(t => t.email === traineeState.email || t.empId === traineeState.empId)) {
            traineeBatch = batch;
            break;
          }
        }
        // Fallback: use first batch if not found
        const batchProgress = traineeBatch ? traineeBatch.weeklyProgress : (progressJson[0]?.weeklyProgress || []);
        // Map to chart format
        const progressChartData = batchProgress.map(w => ({
          week: w.week,
          score: w.progress, // Assuming 'progress' is average score for the week
          completion: w.progress // You can adjust if you have separate completion data
        }));
        if (isMounted) setProgressData(progressChartData);

        // Fetch Skills Assessment
        const skillsRes = await fetch('http://localhost:8000/analytics/skill-heatmap');
        const skillsJson = await skillsRes.json();
        // Find this trainee's batch index
        let batchIdx = 0;
        if (skillsJson.batches && Array.isArray(skillsJson.batches)) {
          batchIdx = skillsJson.batches.findIndex(bn => bn.toLowerCase().includes(traineeState.specialization?.toLowerCase() || ''));
          if (batchIdx === -1) batchIdx = 0;
        }
        // Map skills for this batch
        const skillsChartData = (skillsJson.skills || []).map((skill, i) => ({
          skill,
          score: skillsJson.matrix[i][batchIdx] ?? 0
        }));
        if (isMounted) setSkillsData(skillsChartData);
      } catch (err) {
        // Optionally handle error
      }
    }

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traineeState]);

  useEffect(() => {
    if (traineeState && (!traineeState.last_login || traineeState.last_login === '' || traineeState.last_login === null)) {
      setShowChangePasswordModal(true);
    }
  }, [traineeState]);

  useEffect(() => {
    if (contentRefs.phase1.current) {
      setContentHeight(prev => ({
        ...prev,
        phase1: expandedPhases[1] ? `${contentRefs.phase1.current.scrollHeight}px` : "0px"
      }));
    }
  }, [expandedPhases, contentRefs.phase1]);

  useEffect(() => {
    // Fetch real-time trainee data on mount and when empId changes
    async function fetchTrainee() {
      if (!empId) return;
      try {
        const res = await fetch(`http://localhost:8000/trainees/${empId}`);
        if (res.ok) {
          const data = await res.json();
          setTrainee(data);
        }
      } catch (err) {
        // Optionally handle error
      }
      // Fetch tasks for this trainee
      try {
        const res = await fetch(`http://localhost:8000/trainees/${empId}/tasks`);
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks || []);
        }
      } catch (err) {
        setTasks([]);
      }
    }
    fetchTrainee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empId]);

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
      // Debug: log the payload
      console.log("Sending password change:", {
        email: traineeState.email,
        new_password: newPassword
      });
      const response = await fetch("http://localhost:8000/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
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
          setTrainee(updatedUser);
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

  const handlePhaseClick = (phaseId: number) => {
    navigate(`/trainee-dashboard/${traineeState.empId}/phase/${phaseId}`, {
      state: { user: traineeState }
    });
  };

  const trainings = [
    { id: 1, title: "Programming Fundamentals", status: "completed", progress: 100 },
    { id: 2, title: "Data Structures & Algorithms", status: "in-progress", progress: 75 },
    { id: 3, title: "Database Management", status: "in-progress", progress: 60 },
    { id: 4, title: "Version Control (Git)", status: "pending", progress: 0 },
  ];

  const handleExpand = (phaseId: number) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: true }));
  };

  const handleCollapse = (e: React.MouseEvent, phaseId: number) => {
    e.stopPropagation();
    setExpandedPhases(prev => ({ ...prev, [phaseId]: false }));
  };

  const LockedPhaseCard = ({ expanded, onExpand, onCollapse, hFull = false }) => (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-md opacity-60 min-h-[250px] flex flex-col p-6 ${hFull ? 'h-full' : ''}`}>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-700">Phase 2: Advanced Training</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Complete 80% of Phase 1 to unlock (Current: {traineeState.score}%)
        </p>
        <div className="flex items-center justify-center flex-col mt-16">
          <Lock className="h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-500">Complete Phase 1 to unlock advanced trainings</p>
        </div>
      </div>
    </div>
  );

  const UnlockedPhaseCard = ({ expanded, onExpand, onCollapse }) => (
    <Card
      className={`
        shadow-md border-slate-200 overflow-hidden
        transform transition-all duration-500 ease-in-out
        ${expanded ? 'w-full' : 'hover:scale-[1.02] cursor-pointer hover:shadow-xl hover:border-blue-300'}
      `}
      onClick={() => !expanded && onExpand()}
    >
      <CardHeader>
        <div className="flex items-center gap-4">
          {expanded && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 transition-colors duration-200"
              onClick={onCollapse}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Phase 2: Advanced Training
            </CardTitle>
            <CardDescription>
              Advanced development and architecture concepts
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Overall Progress</span>
            <span className="text-slate-600 font-semibold">0%</span>
          </div>
          <Progress value={0} className="mb-4" />
        </div>

        {expanded && (
          <div className="space-y-4 mt-6">
            {phaseTwoTrainings.map((training, index) => (
              <div 
                key={training.id}
                className="p-6 rounded-lg border border-slate-200 
                  transform transition-all duration-300 ease-in-out
                  hover:scale-[1.01] hover:border-blue-300 hover:shadow-lg 
                  cursor-pointer bg-white group"
                style={{
                  opacity: 1,
                  transform: 'translateY(0)',
                  transition: 'all 0.3s ease-in-out',
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {training.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-500 transition-transform duration-300 group-hover:scale-110" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
                    )}
                    <div>
                      <h3 className="text-lg font-medium group-hover:text-blue-600 transition-colors duration-300">
                        {training.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={
                            training.status === "completed" 
                              ? "default" 
                              : training.status === "in-progress" 
                                ? "default" 
                                : "secondary"
                          }
                          className="transition-all duration-300 group-hover:bg-opacity-90"
                        >
                          {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-500">{training.progress}% Complete</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!traineeState) {
    return <div>Loading...</div>; // Or a more sophisticated loading spinner
  }

  return (
    <>
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="rounded-3xl bg-white shadow-2xl border border-white/40 p-10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-orange-500 mb-4 drop-shadow-sm">Set a New Password</DialogTitle>
            <DialogDescription className="text-gray-500 text-base mb-2">
              Please choose a strong password. It must be at least 8 characters, include an uppercase letter, a number, and a special character.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setPasswordError(""); }}
                  className={`rounded-full bg-white/80 pr-12 ${passwordError ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500" onClick={() => setShowNewPassword(v => !v)} tabIndex={-1}>
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {pwChecks.map((c, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm ${c.valid ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`inline-block w-3 h-3 rounded-full border ${c.valid ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-300'}`}></span>
                    {c.label}
                  </div>
                ))}
              </div>
              {passwordError && Array.isArray(passwordError) ? (
                <ul className="text-xs text-red-500 mt-1 space-y-1">
                  {passwordError.map((err, idx) => <li key={idx}>{typeof err === 'string' ? err : (err.msg || JSON.stringify(err))}</li>)}
                </ul>
              ) : passwordError ? (
                <div className="text-xs text-red-500 mt-1">{typeof passwordError === 'string' ? passwordError : JSON.stringify(passwordError)}</div>
              ) : null}
            </div>
            <div>
              <Label htmlFor="confirm-password">Re-enter Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setConfirmError(""); }}
                  className={`rounded-full bg-white/80 pr-12 ${confirmError ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500" onClick={() => setShowConfirmPassword(v => !v)} tabIndex={-1}>
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
              {confirmPassword && (
                <div className={`mt-2 text-sm ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</div>
              )}
            </div>
            <DialogFooter>
              <Button
                className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold shadow-lg hover:from-orange-600 hover:to-orange-500 transition-colors"
                onClick={handlePasswordChange}
                disabled={!allPwChecks || !passwordsMatch || isChanging}
              >
                {isChanging ? "Changing..." : "Set Password"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #fff7f0 100%)" }}>
        {/* Header */}
        <div className={`w-full ${glass} py-4 px-0 mb-8`} style={{ boxShadow: `0 8px 32px 0 ${accent}22` }}>
          <div className="container mx-auto flex justify-between items-center" style={font}>
            <div className="flex items-center gap-4">
              <span className="rounded-full bg-gradient-to-tr from-orange-400 to-orange-500 p-3 shadow-lg">
                <Brain className="h-7 w-7 text-white" />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: accent, letterSpacing: '-0.04em' }}>Mavericks Training</h1>
                {traineeState && <p className="text-base text-gray-500 font-medium">Welcome back, {traineeState.name} ({traineeState.empId})</p>}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full flex items-center gap-2 border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80" style={font}>
                  <User className="h-4 w-4" />
                  <span>{traineeState.name}</span>
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

        <div className="container mx-auto px-6 py-8">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className={`rounded-3xl ${glass} p-6 flex flex-col items-center transition-transform hover:scale-105`} style={{ boxShadow: `0 8px 32px 0 #3b82f622` }}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-7 w-7 text-blue-400" />
                <span className="text-lg font-semibold text-blue-500">Overall Progress</span>
              </div>
              <span className="text-3xl font-extrabold mt-2 text-blue-600">{traineeState.progress ?? 0}%</span>
            </div>
            <div className={`rounded-3xl ${glass} p-6 flex flex-col items-center transition-transform hover:scale-105`} style={{ boxShadow: `0 8px 32px 0 #10b98122` }}>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-7 w-7 text-emerald-400" />
                <span className="text-lg font-semibold text-emerald-500">Current Phase</span>
              </div>
              <span className="text-3xl font-extrabold mt-2 text-emerald-600">Phase {traineeState.phase ?? 1}</span>
            </div>
            <div className={`rounded-3xl ${glass} p-6 flex flex-col items-center transition-transform hover:scale-105`} style={{ boxShadow: `0 8px 32px 0 #a78bfa22` }}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-7 w-7 text-purple-400" />
                <span className="text-lg font-semibold text-purple-500">Phase 1 Score</span>
              </div>
              <span className="text-3xl font-extrabold mt-2 text-purple-600">{traineeState.score ?? 0}%</span>
            </div>
            <div className={`rounded-3xl ${glass} p-6 flex flex-col items-center transition-transform hover:scale-105`} style={{ boxShadow: `0 8px 32px 0 #f59e0b22` }}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-7 w-7 text-orange-400" />
                <span className="text-lg font-semibold text-orange-500">Days Remaining</span>
              </div>
              <span className="text-3xl font-extrabold mt-2" style={{ color: accent2 }}>
                {(() => {
                  const created = traineeState.created_at ? dayjs(traineeState.created_at) : null;
                  if (!created) return 60;
                  const now = dayjs();
                  const daysElapsed = now.diff(created, 'day');
                  const daysLeft = 60 - daysElapsed;
                  return daysLeft > 0 ? daysLeft : 0;
                })()}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-10">
            <div className="flex gap-4 bg-white/60 backdrop-blur-md rounded-full shadow-lg p-2" style={font}>
              {['overview', 'training', 'assignments', 'analytics'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-7 py-2 rounded-full font-semibold text-lg transition-all duration-200 shadow-sm border-2 ${activeTab === tab ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white border-orange-400 scale-105' : 'bg-white/80 text-orange-500 border-orange-200 hover:bg-orange-50 hover:scale-105'}`}
                  style={{ minWidth: 120 }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Progress Chart */}
                <div className={`rounded-3xl ${glass} p-8 shadow-xl`}>
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="h-7 w-7 text-blue-400" />
                    <span className="text-xl font-bold text-blue-500">Weekly Progress</span>
                  </div>
                  <div className="w-full h-64 flex items-center justify-center">
                    {progressData.length === 0 ? (
                      <span className="text-gray-400 text-lg">No data is available</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} />
                          <Line type="monotone" dataKey="completion" stroke="#10b981" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
                {/* Skills Assessment */}
                <div className={`rounded-3xl ${glass} p-8 shadow-xl`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-7 w-7 text-purple-400" />
                    <span className="text-xl font-bold text-purple-500">Skills Assessment</span>
                  </div>
                  <div className="w-full h-64 flex items-center justify-center">
                    {skillsData.length === 0 || skillsData.every(s => !s.score || s.score === 0) ? (
                      <span className="text-gray-400 text-lg">No data is available</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={skillsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="skill" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="score" fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
              {/* Upcoming Tasks */}
              <div className={`rounded-3xl ${glass} p-8 shadow-xl`}>
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-7 w-7 text-orange-400" />
                  <span className="text-xl font-bold text-orange-500">Upcoming Tasks</span>
                </div>
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-gray-400 text-lg">No tasks to display.</div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id || task._id} className="flex items-center justify-between p-3 bg-white/70 rounded-xl shadow-sm">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-gray-600">Due: {task.due}</p>
                        </div>
                        <Badge 
                          variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'training' && (
            <div className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-8 items-stretch">
                {/* Phase 1 Card */}
                <div className={`rounded-3xl ${glass} p-6 shadow-xl cursor-pointer transition-transform hover:scale-105 h-full min-h-[250px]`} onClick={() => handleExpand(1)}>
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                    <span className="text-xl font-bold text-emerald-500">Phase 1: Foundation Training</span>
                  </div>
                  <div className="mb-4">
                    <span className="font-medium text-gray-700">Core programming and development fundamentals</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-emerald-600 font-semibold">{traineeState.score}%</span>
                  </div>
                  <Progress value={traineeState.score} className="mb-4" />
                  {expandedPhases[1] && (
                    <Button variant="ghost" size="icon" className="hover:bg-orange-50 transition-colors duration-200 mb-4" onClick={e => handleCollapse(e, 1)}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  {expandedPhases[1] && (
                    <div className="space-y-4 mt-6">
                      {phaseOneTrainings.map((training, index) => (
                        <div 
                          key={training.id}
                          className="p-6 rounded-xl border border-orange-100 bg-white/80 shadow group hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                          style={{ transitionDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            {training.status === "completed" ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-blue-500" />
                            )}
                            <div>
                              <h3 className="text-lg font-medium group-hover:text-orange-600 transition-colors duration-300">
                                {training.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={
                                    training.status === "completed" 
                                      ? "default" 
                                      : training.status === "in-progress" 
                                        ? "default" 
                                        : "secondary"
                                  }
                                >
                                  {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                                </Badge>
                                <span className="text-sm text-gray-500">{training.progress}% Complete</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Phase 2 Card */}
                {traineeState.score >= 80 ? (
                  <UnlockedPhaseCard expanded={expandedPhases[2]} onExpand={() => handleExpand(2)} onCollapse={e => handleCollapse(e, 2)} />
                ) : (
                  <LockedPhaseCard expanded={expandedPhases[2]} onExpand={() => handleExpand(2)} onCollapse={e => handleCollapse(e, 2)} hFull />
                )}
              </div>
            </div>
          )}
          {activeTab === 'assignments' && (
            <div className={`rounded-3xl ${glass} p-8 shadow-xl`}>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-7 w-7 text-orange-400" />
                <span className="text-xl font-bold text-orange-500">Assignments</span>
              </div>
              <div className="space-y-3">
                {/* Placeholder for assignments list */}
                <div className="text-gray-500">No assignments available yet.</div>
              </div>
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className={`rounded-3xl ${glass} p-8 shadow-xl mb-8`}>
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-7 w-7 text-blue-400" />
                  <span className="text-xl font-bold text-blue-500">AI-Generated Analytics Report</span>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">AI Insights</h3>
                  </div>
                  <div className="space-y-3 text-blue-800">
                    <p>• <strong>Strong Performance:</strong> Excelling in problem-solving and algorithmic thinking</p>
                    <p>• <strong>Recommendation:</strong> Python specialization aligns with your analytical strengths</p>
                    <p>• <strong>Areas for Improvement:</strong> Focus on database optimization techniques</p>
                    <p>• <strong>Predicted Completion:</strong> On track to complete Phase 1 by next week</p>
                  </div>
                </div>
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className={`rounded-3xl ${glass} p-6 shadow-xl`}>
                    <div className="text-lg font-semibold mb-4">Performance Metrics</div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Assignment Completion Rate</span>
                        <span className="font-semibold">92%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Quiz Score</span>
                        <span className="font-semibold">87%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Management</span>
                        <span className="font-semibold text-green-600">Excellent</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peer Collaboration</span>
                        <span className="font-semibold text-blue-600">Above Average</span>
                      </div>
                    </div>
                  </div>
                  <div className={`rounded-3xl ${glass} p-6 shadow-xl`}>
                    <div className="text-lg font-semibold mb-4">Learning Velocity</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TraineeDashboard;
