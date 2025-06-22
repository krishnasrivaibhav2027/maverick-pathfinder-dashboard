import { useState, useEffect } from "react";
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

const TraineeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // User state will now be primarily driven by the location state passed from login
  const [trainee, setTrainee] = useState(location.state?.user || null);

  // State for the FIRST login password modal
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // State for the CHANGE password modal
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPasswordChange, setNewPasswordChange] = useState("");
  const [confirmNewPasswordChange, setConfirmNewPasswordChange] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // If user data is in location state and they need to change password, show the modal.
    if (trainee && trainee.password_is_temporary) {
      setShowSetPasswordModal(true);
    }
  }, [trainee]);

  const handleSetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match.",
      });
      return;
    }
    if (newPassword.length < 8) {
        toast({
            variant: "destructive",
            title: "Password must be at least 8 characters long.",
        });
        return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("http://localhost:8000/api/user/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trainee.email,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Password Updated",
          description: "Your new password has been set successfully.",
        });
        setShowSetPasswordModal(false);
        // Optionally update the local trainee state
        setTrainee(prev => ({ ...prev, password_is_temporary: false }));
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: errorData.detail || "Could not update password.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not connect to the server.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

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

  // Mock data for charts
  const progressData = [
    { week: 'Week 1', score: 65, completion: 25 },
    { week: 'Week 2', score: 72, completion: 45 },
    { week: 'Week 3', score: 78, completion: 65 },
    { week: 'Week 4', score: 85, completion: 85 },
  ];

  const skillsData = [
    { skill: 'Programming Basics', score: 90 },
    { skill: 'Problem Solving', score: 85 },
    { skill: 'Database Fundamentals', score: 78 },
    { skill: 'Version Control', score: 82 },
  ];

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

  if (!trainee) {
    return <div>Loading...</div>; // Or a more sophisticated loading spinner
  }

  return (
    <>
      {/* First-time password set modal */}
      <AlertDialog open={showSetPasswordModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Welcome! Please set your password.</AlertDialogTitle>
            <AlertDialogDescription>
              For your security, you must set a permanent password before you
              can access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSetPassword} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Set Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change password modal */}
      <AlertDialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Your Password</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">Current Password</Label>
              <Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password-change">New Password</Label>
              <Input id="new-password-change" type="password" value={newPasswordChange} onChange={(e) => setNewPasswordChange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password-change">Confirm New Password</Label>
              <Input id="confirm-new-password-change" type="password" value={confirmNewPasswordChange} onChange={(e) => setConfirmNewPasswordChange(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowChangePasswordModal(false)}>Cancel</Button>
            <AlertDialogAction onClick={handleChangePassword} disabled={isChanging}>
              {isChanging ? "Changing..." : "Change Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-slate-100 text-slate-800">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Mavericks Training</h1>
                  {trainee && <p className="text-sm text-slate-500">Welcome back, {trainee.name} ({trainee.empId})</p>}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800">
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
                  <DropdownMenuItem onClick={() => navigate('/')}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-blue-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Overall Progress</p>
                    <p className="text-3xl font-bold">{trainee.progress}%</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Current Phase</p>
                    <p className="text-3xl font-bold">Phase {trainee.phase}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Phase 1 Score</p>
                    <p className="text-3xl font-bold">{trainee.score}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-orange-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Days Remaining</p>
                    <p className="text-3xl font-bold">12</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="bg-transparent p-0 border-b border-slate-200 mb-6">
              <TabsTrigger value="overview" className="bg-transparent shadow-none border-b-2 border-transparent rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none text-slate-500 pb-3 px-4">Overview</TabsTrigger>
              <TabsTrigger value="trainings" className="bg-transparent shadow-none border-b-2 border-transparent rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none text-slate-500 pb-3 px-4">Trainings</TabsTrigger>
              <TabsTrigger value="assignments" className="bg-transparent shadow-none border-b-2 border-transparent rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none text-slate-500 pb-3 px-4">Assignments</TabsTrigger>
              <TabsTrigger value="timeline" className="bg-transparent shadow-none border-b-2 border-transparent rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none text-slate-500 pb-3 px-4">Timeline</TabsTrigger>
              <TabsTrigger value="analytics" className="bg-transparent shadow-none border-b-2 border-transparent rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none text-slate-500 pb-3 px-4">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Progress Chart */}
                <Card className="shadow-md border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-slate-500" />
                      Weekly Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} />
                        <Line type="monotone" dataKey="completion" stroke="#10b981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Skills Assessment */}
                <Card className="shadow-md border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-slate-500" />
                      Skills Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={skillsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="skill" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="score" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Tasks */}
              <Card className="shadow-md border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-slate-500" />
                    Upcoming Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trainings" className="space-y-6">
              <div className="grid gap-4">
                {trainings.map((training) => (
                  <Card key={training.id} className="shadow-md border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{training.title}</h3>
                        <Badge 
                          variant={training.status === 'completed' ? 'default' : training.status === 'in-progress' ? 'secondary' : 'outline'}
                        >
                          {training.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <Progress value={training.progress} className="mb-4" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{training.progress}% Complete</span>
                        <Button size="sm" disabled={training.status === 'pending'}>
                          {training.status === 'completed' ? 'Review' : training.status === 'in-progress' ? 'Continue' : 'Start'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-6">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Assignments</CardTitle>
                    <CardDescription>Complete these assignments to progress in your training</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">JavaScript Calculator Project</h4>
                          <Badge>In Progress</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Create a functional calculator using vanilla JavaScript</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Due: Tomorrow</span>
                          <Button size="sm">Continue</Button>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Database Schema Design</h4>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Design a database schema for an e-commerce application</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Due: 5 days</span>
                          <Button size="sm" variant="outline">Start</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Phase 1 */}
                <Card className="shadow-md border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Phase 1: Foundation Training
                    </CardTitle>
                    <CardDescription>Core programming and development fundamentals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Overall Progress</span>
                        <span className="text-green-600 font-semibold">{trainee.score}%</span>
                      </div>
                      <Progress value={trainee.score} className="mb-4" />
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Programming Fundamentals</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Version Control (Git)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Database Fundamentals</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Phase 2 */}
                <Card className="shadow-md border-slate-200 opacity-60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lock className="h-5 w-5 text-gray-400" />
                      Phase 2: Domain Specialization
                    </CardTitle>
                    <CardDescription>
                      {trainee.score >= 80 
                        ? "Unlocked! Based on your performance, Python track recommended" 
                        : `Locked - Complete Phase 1 with 80%+ score (Current: ${trainee.score}%)`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        {trainee.score >= 80 ? (
                          <div>
                            <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-blue-600">AI Recommendation: Python Track</p>
                            <p className="text-sm text-gray-600 mt-2">Based on your strong performance in algorithms and problem-solving</p>
                            <Button className="mt-4" disabled={trainee.score < 85}>
                              Start Python Specialization
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Complete Phase 1 to unlock specialization tracks</p>
                            <div className="mt-4 space-y-2">
                              <Badge variant="outline">Python Development</Badge>
                              <Badge variant="outline">Java Enterprise</Badge>
                              <Badge variant="outline">.NET Framework</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6">
                <Card className="shadow-md border-slate-200">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>AI-Generated Analytics Report</CardTitle>
                      <CardDescription>Automated insights and performance summary</CardDescription>
                    </div>
                    <Button className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Report
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
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

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Performance Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Learning Velocity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={progressData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="week" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default TraineeDashboard;
