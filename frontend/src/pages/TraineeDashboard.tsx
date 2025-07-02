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
  AlertDialogDescription,
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

  // New: Real API data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPhase, setSelectedPhase] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPasswordChange, setNewPasswordChange] = useState("");
  const [confirmNewPasswordChange, setConfirmNewPasswordChange] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [contentHeight, setContentHeight] = useState({ phase1: "0px" });
  const contentRefs = {
    phase1: useRef(null)
  };

  const [activeTab, setActiveTab] = useState('overview');

  const phaseOneTrainings = [
    { id: 1, title: "Programming Fundamentals", status: "completed", progress: 100 },
    { id: 2, title: "Version Control (Git)", status: "in-progress", progress: 60 },
    { id: 3, title: "Database Fundamentals", status: "pending", progress: 0 },
  ];

  const phaseTwoTrainings = [
    { id: 5, title: "Advanced Backend Development", status: "pending", progress: 0 },
    { id: 6, title: "Cloud Architecture", status: "pending", progress: 0 },
    { id: 7, title: "System Design", status: "pending", progress: 0 },
    { id: 8, title: "DevOps and CI/CD", status: "pending", progress: 0 }
  ];

  const [progressData, setProgressData] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  const POLL_INTERVAL = 300000; // 5 minutes in ms

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const id = empId || localStorage.getItem('user_id');
        const res = await fetch(`http://localhost:8000/trainee/dashboard/by-empid/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch dashboard');
        const data = await res.json();
        setDashboardData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [empId]);

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
          if (batch.trainees && batch.trainees.some(t => t.email === trainee.email || t.empId === trainee.empId)) {
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
          batchIdx = skillsJson.batches.findIndex(bn => bn.toLowerCase().includes(trainee.specialization?.toLowerCase() || ''));
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
  }, [trainee]);

  useEffect(() => {
    // If user data is in location state and they need to change password, show the modal.
    if (trainee && trainee.password_is_temporary) {
      setShowChangePasswordModal(true);
    }
  }, [trainee]);

  useEffect(() => {
    if (contentRefs.phase1.current) {
      setContentHeight(prev => ({
        ...prev,
        phase1: expandedPhase === 1 ? `${contentRefs.phase1.current.scrollHeight}px` : "0px"
      }));
    }
  }, [expandedPhase, contentRefs.phase1]);

  const handleChangePassword = async () => {
    if (newPasswordChange !== confirmNewPasswordChange) {
      toast({ variant: "destructive", title: "New passwords do not match." });
      return;
    }
    if (newPasswordChange.length < 8) {
      toast({ variant: "destructive", title: "New password must be at least 8 characters long."});
      return;
    }

    setIsChanging(true);
    try {
      const response = await fetch("http://localhost:8000/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trainee.email,
          old_password: oldPassword,
          new_password: newPasswordChange,
        }),
      });

      if (response.ok) {
        toast({ title: "✅ Password Changed", description: "Your password has been updated." });
        setShowChangePasswordModal(false);
        setOldPassword("");
        setNewPasswordChange("");
        setConfirmNewPasswordChange("");
      } else {
        const errorData = await response.json();
        toast({ variant: "destructive", title: "Change Failed", description: errorData.detail || "Could not change password." });
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Connection Error", description: "Could not connect to the server." });
    } finally {
      setIsChanging(false);
    }
  };

  const handlePhaseClick = (phaseId: number) => {
    navigate(`/trainee-dashboard/${trainee.empId}/phase/${phaseId}`, {
      state: { user: trainee }
    });
  };

  const upcomingTasks = [
    { id: 1, title: "Complete JavaScript Fundamentals", due: "Tomorrow", priority: "High" },
    { id: 2, title: "Submit Database Design Assignment", due: "3 days", priority: "Medium" },
    { id: 3, title: "Peer Code Review", due: "1 week", priority: "Low" },
  ];

  const trainings = [
    { id: 1, title: "Programming Fundamentals", status: "completed", progress: 100 },
    { id: 2, title: "Data Structures & Algorithms", status: "in-progress", progress: 75 },
    { id: 3, title: "Database Management", status: "in-progress", progress: 60 },
    { id: 4, title: "Version Control (Git)", status: "pending", progress: 0 },
  ];

  const handleExpand = () => {
    if (!expandedPhase) {
      setExpandedPhase(1);
    }
  };

  const handleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPhase(null);
  };

  const LockedPhaseCard = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-md opacity-60 min-h-[250px] flex flex-col">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-700">Phase 2: Advanced Training</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Complete 80% of Phase 1 to unlock (Current: {trainee.score}%)
        </p>
        <div className="flex-1 flex items-center justify-center flex-col">
          <Lock className="h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-500">Complete Phase 1 to unlock advanced trainings</p>
        </div>
      </div>
    </div>
  );

  const UnlockedPhaseCard = () => (
    <Card
      className={`
        shadow-md border-slate-200 overflow-hidden
        transform transition-all duration-500 ease-in-out
        ${expandedPhase === 2 
          ? 'w-full'
          : 'hover:scale-[1.02] cursor-pointer hover:shadow-xl hover:border-blue-300'
        }
      `}
      onClick={() => !expandedPhase && setExpandedPhase(2)}
    >
      <CardHeader>
        <div className="flex items-center gap-4">
          {expandedPhase === 2 && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedPhase(null);
              }}
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

        {expandedPhase === 2 && (
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

  if (!trainee) {
    return <div>Loading...</div>; // Or a more sophisticated loading spinner
  }

  return (
    <div>
      {loading && <div className="p-4">Loading dashboard...</div>}
      {error && <div className="p-4 text-red-500">{error}</div>}
      {dashboardData && (
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-2">Welcome, {dashboardData.name}</h2>
          {dashboardData.courses.map((course: any) => (
            <div key={course.id} className="mb-4 p-2 border rounded-lg bg-white/80">
              <h3 className="font-semibold text-lg">{course.name} (Phase {course.phase})</h3>
              <div className="ml-4">
                <div className="font-medium">Subtopics:</div>
                <ul className="list-disc ml-6">
                  {course.subtopics.map((s: any) => (
                    <li key={s.id}>{s.title}</li>
                  ))}
                </ul>
                <div className="font-medium mt-2">Quiz/Tasks:</div>
                <ul className="list-disc ml-6">
                  {course.quiztasks.map((q: any) => (
                    <li key={q.id}>{q.type} (Subtopics: {q.subtopic_ids})</li>
                  ))}
                </ul>
                <div className="font-medium mt-2">Attempts:</div>
                <ul className="list-disc ml-6">
                  {course.attempts.map((a: any, i: number) => (
                    <li key={i}>QuizTask {a.quiztask_id}: Score {a.score}, Status {a.status}, Attempt {a.attempt_number}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* First-time password set modal */}
      <AlertDialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <AlertDialogContent className={`rounded-3xl ${glass} p-8`} style={{ boxShadow: `0 8px 32px 0 ${accent}22` }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-orange-500">Change Your Password</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">Current Password</Label>
              <Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="rounded-full bg-white/80" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password-change">New Password</Label>
              <Input id="new-password-change" type="password" value={newPasswordChange} onChange={(e) => setNewPasswordChange(e.target.value)} className="rounded-full bg-white/80" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password-change">Confirm New Password</Label>
              <Input id="confirm-new-password-change" type="password" value={confirmNewPasswordChange} onChange={(e) => setConfirmNewPasswordChange(e.target.value)} className="rounded-full bg-white/80" />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setShowChangePasswordModal(false)}>Cancel</Button>
            <AlertDialogAction className="rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white" onClick={handleChangePassword} disabled={isChanging}>
              {isChanging ? "Changing..." : "Change Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                {trainee && <p className="text-base text-gray-500 font-medium">Welcome back, {trainee.name} ({trainee.empId})</p>}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full flex items-center gap-2 border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80" style={font}>
                  <User className="h-4 w-4" />
                  <span>{trainee.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/')}> <LogOut className="mr-2 h-4 w-4" /> <span>Logout</span> </DropdownMenuItem>
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
              <span className="text-3xl font-extrabold mt-2 text-blue-600">{trainee.progress}%</span>
            </div>
            <div className={`rounded-3xl ${glass} p-6 flex flex-col items-center transition-transform hover:scale-105`} style={{ boxShadow: `0 8px 32px 0 #10b98122` }}>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-7 w-7 text-emerald-400" />
                <span className="text-lg font-semibold text-emerald-500">Current Phase</span>
              </div>
              <span className="text-3xl font-extrabold mt-2 text-emerald-600">Phase {trainee.phase}</span>
            </div>
            <div className={`rounded-3xl ${glass} p-6 flex flex-col items-center transition-transform hover:scale-105`} style={{ boxShadow: `0 8px 32px 0 #a78bfa22` }}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-7 w-7 text-purple-400" />
                <span className="text-lg font-semibold text-purple-500">Phase 1 Score</span>
              </div>
              <span className="text-3xl font-extrabold mt-2 text-purple-600">{trainee.score}%</span>
            </div>
            <div className={`rounded-3xl ${glass} p-6 flex flex-col items-center transition-transform hover:scale-105`} style={{ boxShadow: `0 8px 32px 0 #f59e0b22` }}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-7 w-7 text-orange-400" />
                <span className="text-lg font-semibold text-orange-500">Days Remaining</span>
              </div>
              <span className="text-3xl font-extrabold mt-2" style={{ color: accent2 }}>12</span>
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
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-white/70 rounded-xl shadow-sm">
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
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'training' && (
            <div className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Phase 1 Card */}
                <div className={`rounded-3xl ${glass} p-8 shadow-xl cursor-pointer transition-transform hover:scale-105`} onClick={handleExpand}>
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                    <span className="text-xl font-bold text-emerald-500">Phase 1: Foundation Training</span>
                  </div>
                  <div className="mb-4">
                    <span className="font-medium text-gray-700">Core programming and development fundamentals</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-emerald-600 font-semibold">{trainee.score}%</span>
                  </div>
                  <Progress value={trainee.score} className="mb-4" />
                  {expandedPhase === 1 && (
                    <Button variant="ghost" size="icon" className="hover:bg-orange-50 transition-colors duration-200 mb-4" onClick={handleCollapse}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  {expandedPhase === 1 && (
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
                {trainee.score >= 80 ? (
                  <UnlockedPhaseCard />
                ) : (
                  <LockedPhaseCard />
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
    </div>
  );
};

export default TraineeDashboard;
