import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Download,
  Search,
  Filter,
  Brain,
  LogOut,
  UserCircle,
  CheckCircle,
  AlertCircle,
  UserPlus
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import TraineeOnboarding from "@/components/TraineeOnboarding";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [trainees, setTrainees] = useState([]);

  useEffect(() => {
    const fetchTrainees = async () => {
      try {
        const response = await fetch("http://localhost:8000/trainees");
        const data = await response.json();
        setTrainees(data);
      } catch (error) {
        console.error("Failed to fetch trainees:", error);
      }
    };

    fetchTrainees();
  }, []);

  // Mock data
  const overallStats = {
    totalTrainees: 124,
    activeTrainees: 98,
    completedPhase1: 45,
    avgScore: 82
  };

  const phaseDistribution = [
    { name: 'Phase 1', value: 79, color: '#3b82f6' },
    { name: 'Phase 2 - Python', value: 28, color: '#10b981' },
    { name: 'Phase 2 - Java', value: 12, color: '#f59e0b' },
    { name: 'Phase 2 - .NET', value: 5, color: '#ef4444' }
  ];

  const weeklyProgress = [
    { week: 'Week 1', newJoiners: 12, completions: 8, avgScore: 75 },
    { week: 'Week 2', newJoiners: 15, completions: 10, avgScore: 78 },
    { week: 'Week 3', newJoiners: 18, completions: 14, avgScore: 82 },
    { week: 'Week 4', newJoiners: 22, completions: 18, avgScore: 85 },
  ];

  const filteredTrainees = trainees.filter(trainee => 
    trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trainee.empId && trainee.empId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Mavericks Training Management Portal</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Trainees</p>
                  <p className="text-3xl font-bold">{overallStats.totalTrainees}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Active Trainees</p>
                  <p className="text-3xl font-bold">{overallStats.activeTrainees}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Phase 1 Complete</p>
                  <p className="text-3xl font-bold">{overallStats.completedPhase1}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Average Score</p>
                  <p className="text-3xl font-bold">{overallStats.avgScore}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trainees">All Trainees</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Weekly Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Weekly Training Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="newJoiners" stroke="#3b82f6" strokeWidth={3} name="New Joiners" />
                      <Line type="monotone" dataKey="completions" stroke="#10b981" strokeWidth={3} name="Completions" />
                      <Line type="monotone" dataKey="avgScore" stroke="#f59e0b" strokeWidth={3} name="Avg Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Phase Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Training Phase Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={phaseDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {phaseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">David Brown completed Phase 1</p>
                      <p className="text-sm text-gray-600">Score: 95% - Recommended for Python specialization</p>
                    </div>
                    <span className="text-sm text-gray-500 ml-auto">2 hours ago</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <UserCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">5 new trainees joined today</p>
                      <p className="text-sm text-gray-600">AI agent automatically generated credentials</p>
                    </div>
                    <span className="text-sm text-gray-500 ml-auto">4 hours ago</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Mike Johnson needs attention</p>
                      <p className="text-sm text-gray-600">Behind schedule on current assignments</p>
                    </div>
                    <span className="text-sm text-gray-500 ml-auto">6 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainees" className="space-y-6">
            <div>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search trainees by name or employee ID..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrainees.map((trainee) => (
                  <Link to={`/trainee-dashboard/${trainee.empId}`} key={trainee.empId} className="block text-inherit no-underline">
                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors h-full flex flex-col">
                      <CardContent className="p-0 flex-grow">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 border-b pb-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${trainee.name}`} />
                              <AvatarFallback>{trainee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{trainee.name}</h3>
                              <p className="text-sm text-gray-600">{trainee.empId}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Phase</p>
                              <Badge variant={trainee.phase === 2 ? "default" : "secondary"}>
                                Phase {trainee.phase}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-gray-500">Status</p>
                              <Badge variant={trainee.status === 'active' ? 'default' : 'destructive'}>{trainee.status}</Badge>
                            </div>
                            <div>
                              <p className="text-gray-500">Progress</p>
                              <div className="flex items-center gap-2">
                                <Progress value={trainee.progress} className="w-full" />
                                <p className="font-semibold">{trainee.progress}%</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500">Score</p>
                              <p className="font-semibold text-green-600">{trainee.score}%</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-500">Specialization</p>
                              <Badge variant="outline">{trainee.specialization}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6">
              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-3">Performance Trends</h3>
                        <div className="space-y-2 text-blue-800">
                          <p>• Average completion time: 6.2 weeks (improving)</p>
                          <p>• High performers: 34% (Python track preference)</p>
                          <p>• At-risk trainees: 8% (need intervention)</p>
                          <p>• Most challenging topic: Database Design</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-3">Recommendations</h3>
                        <div className="space-y-2 text-blue-800">
                          <p>• Increase database training duration by 20%</p>
                          <p>• Add peer mentoring for struggling students</p>
                          <p>• Create advanced Python track for top performers</p>
                          <p>• Schedule mid-phase check-ins</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Analytics */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={[
                        { range: '0-50', count: 2 },
                        { range: '51-70', count: 8 },
                        { range: '71-80', count: 24 },
                        { range: '81-90', count: 45 },
                        { range: '91-100', count: 21 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Completion Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={[
                        { month: 'Jan', completed: 8 },
                        { month: 'Feb', completed: 12 },
                        { month: 'Mar', completed: 18 },
                        { month: 'Apr', completed: 25 },
                        { month: 'May', completed: 32 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Generate Reports
                </CardTitle>
                <CardDescription>Download comprehensive training reports and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Overall Training Statistics</h3>
                    <p className="text-sm text-gray-600 mb-4">Complete overview of all training programs and participant progress</p>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Full Report
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Individual Progress Reports</h3>
                    <p className="text-sm text-gray-600 mb-4">Detailed reports for each trainee including scores and recommendations</p>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Individual Reports
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">AI Analytics Summary</h3>
                    <p className="text-sm text-gray-600 mb-4">AI-generated insights and performance predictions</p>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download AI Report
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Monthly Summary</h3>
                    <p className="text-sm text-gray-600 mb-4">Monthly training progress and completion statistics</p>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Monthly Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-6">
            <TraineeOnboarding />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
