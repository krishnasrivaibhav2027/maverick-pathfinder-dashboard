import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
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
  Unlock,
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
import TraineeLayout from "@/components/TraineeLayout";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';

const accent = "#FF512F";
const accent2 = "#F09819";
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

interface AnalyticsData {
  progress?: { [key: string]: number };
  completed_courses?: number;
  avg_score?: number;
  quiz_pass_rate?: number;
  ai_insights?: { recommendations?: string };
}

// Define types for quiz data
interface QuizQuestion {
  _id: string;
  text: string;
  options: string[];
}
interface QuizData {
  _id: string;
  questions: QuizQuestion[];
}
interface QuizResult {
  score?: number;
  feedback?: string;
}

const TraineeDashboard = () => {
  // Define phaseTwoTrainings as an empty array to prevent map errors if not populated
  const phaseTwoTrainings = [];

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

  // Add at the top, after useState declarations
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedSubcourse, setExpandedSubcourse] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedSubcourse, setSelectedSubcourse] = useState(null);

  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState<{ course_id: string, completed_subcourses: string[] }[]>([]);

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

  // Add refs for course blocks
  const courseRefs = useRef({});

  // Memoized relevant courses based on trainee's batch and common courses
  const relevantCourses = React.useMemo(() => {
    if (!courses || courses.length === 0 || !traineeState) {
      return [];
    }

    const traineeBatch = traineeState.specialization?.toLowerCase() || null;

    const filtered = courses.filter(course => {
      if (!course.batch_specificity || !course.course_id) return false;
      const courseSpecificity = course.batch_specificity.toLowerCase();

      if (courseSpecificity === 'common') {
        return true;
      }
      if (traineeBatch && courseSpecificity === traineeBatch) {
        return true;
      }
      return false;
    });

    // Deduplicate based on course_id
    const uniqueCourses = [];
    const seenIds = new Set();
    for (const course of filtered) {
      if (!seenIds.has(course.course_id)) {
        uniqueCourses.push(course);
        seenIds.add(course.course_id);
      }
    }
    return uniqueCourses;
  }, [courses, traineeState]);

  // console.log("TraineeDashboard: traineeState:", traineeState);
  // console.log("TraineeDashboard: courses state:", courses);
  // console.log("TraineeDashboard: relevantCourses:", relevantCourses);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Add new state for re-attempt modal and short notes
  const [showReattemptModal, setShowReattemptModal] = useState(false);
  const [reattemptShortNotes, setReattemptShortNotes] = useState<string | null>(null);
  const [reattemptLoading, setReattemptLoading] = useState(false);
  const [reattemptError, setReattemptError] = useState<string | null>(null);
  const [reattemptTestId, setReattemptTestId] = useState<string | null>(null);

  // Add new state for quiz modal logic
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!empId) return;
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v2/trainees/${empId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    }
    fetchAnalytics();
  }, [empId]);

  useEffect(() => {
    async function fetchCourses() {
      console.log("Fetching /courses...");
      try {
        const res = await fetch("http://localhost:8000/courses");
        console.log("/courses response status:", res.status);
        if (res.ok) {
          const data = await res.json();
          console.log("Raw data from /courses:", data);
          setCourses(data.courses || data || []); // Adjust based on actual API (data.courses or data itself)
        } else {
          console.error("Failed to fetch /courses, status:", res.status);
          setCourses([]); // Set to empty on error
        }
      } catch (err) {
        console.error("Error fetching /courses:", err);
        setCourses([]); // Set to empty on error
      }
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    async function fetchProgress() {
      if (!empId) return;
      try {
        const res = await fetch(`http://localhost:8000/trainees/${empId}/progress`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data.progress || []);
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchProgress();
  }, [empId]);

  // Temporarily commenting out chart data fetching to isolate course display issues
  // useEffect(() => {
  //   let isMounted = true;
  //   const intervalId = setInterval(fetchChartData, POLL_INTERVAL);

  //   async function fetchChartData() {
  //     try {
  //       // Fetch Weekly Progress
  //       const progressRes = await fetch('http://localhost:8000/batches/weekly-progress');
  //       const progressJson = await progressRes.json();
  //       // Find this trainee's batch (by empId)
  //       let traineeBatch = null;
  //       for (const batch of progressJson) {
  //         if (batch.trainees && batch.trainees.some(t => t.email === traineeState.email || t.empId === traineeState.empId)) {
  //           traineeBatch = batch;
  //           break;
  //         }
  //       }
  //       // Fallback: use first batch if not found
  //       const batchProgress = traineeBatch ? traineeBatch.weeklyProgress : (progressJson[0]?.weeklyProgress || []);
  //       // Map to chart format
  //       const progressChartData = batchProgress.map(w => ({
  //         week: w.week,
  //         score: w.progress, // Assuming 'progress' is average score for the week
  //         completion: w.progress // You can adjust if you have separate completion data
  //       }));
  //       if (isMounted) setProgressData(progressChartData);

  //       // Fetch Skills Assessment
  //       const skillsRes = await fetch('http://localhost:8000/analytics/skill-heatmap');
  //       const skillsJson = await skillsRes.json();
  //       // Find this trainee's batch index
  //       let batchIdx = 0;
  //       if (skillsJson.batches && Array.isArray(skillsJson.batches)) {
  //         batchIdx = skillsJson.batches.findIndex(bn => bn.toLowerCase().includes(traineeState.specialization?.toLowerCase() || ''));
  //         if (batchIdx === -1) batchIdx = 0;
  //       }
  //       // Map skills for this batch
  //       const skillsChartData = (skillsJson.skills || []).map((skill, i) => ({
  //         skill,
  //         score: skillsJson.matrix[i][batchIdx] ?? 0
  //       }));
  //       if (isMounted) setSkillsData(skillsChartData);
  //     } catch (err) {
  //       // Optionally handle error
  //       console.error("Error in fetchChartData:", err);
  //     }
  //   }

  //   return () => {
  //     isMounted = false;
  //     clearInterval(intervalId);
  //   };
  // }, [traineeState]);

  useEffect(() => {
    if (
      traineeState &&
      (traineeState.password_is_temporary === true ||
        (traineeState.password_is_temporary === undefined && (!traineeState.last_login || traineeState.last_login === '' || traineeState.last_login === null)))
    ) {
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
          console.log("TraineeDashboard: Fetched traineeState data:", data); // Log trainee data
          setTrainee(data);
        } else {
          console.error("Failed to fetch trainee data, status:", res.status);
        }
      } catch (err) {
        console.error("Error fetching trainee data:", err);
      }
      // Fetch tasks for this trainee, with graceful error handling for 404s
      try {
        const tasksRes = await fetch(`http://localhost:8000/trainees/${empId}/tasks`);
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData.tasks || []);
        } else {
          if (tasksRes.status === 404) {
            console.warn(`Task endpoint not found for trainee ${empId} (404). Displaying no tasks. Please ensure backend endpoint '/trainees/{emp_id}/tasks' is correctly implemented if tasks are expected.`);
          } else {
            console.error(`Failed to fetch tasks for trainee ${empId}, status: ${tasksRes.status}`);
          }
          setTasks([]); // Set empty on any error or non-OK response for tasks
        }
      } catch (err) {
        console.error(`Error fetching tasks for trainee ${empId}:`, err);
        setTasks([]); // Set empty on network error
      }
    }
    fetchTrainee();
  }, [empId]);

  useEffect(() => {
    if (traineeState && traineeState.name) {
      // console.log("TraineeDashboard: Storing traineeState to localStorage:", traineeState);
      localStorage.setItem('traineeState', JSON.stringify(traineeState));
    }
  }, [traineeState]);

  useEffect(() => {
    const { courseIdToFocus, previousPage, user: navUser } = location.state || {};

    if (navUser) {
      // If user object is passed in navigation state, update traineeState
      // This is important if the dashboard was loaded directly without full state initially
      setTrainee(prevTrainee => ({ ...prevTrainee, ...navUser }));
    }

    if (previousPage === 'courseDetail' && courseIdToFocus) {
      setActiveTab('training');

      // Assuming all courses for now are in Phase 1.
      // A more robust solution would check which phase the courseIdToFocus belongs to.
      const phaseIdToExpand = 1; // Or determine this dynamically
      setExpandedPhases(prev => ({ ...prev, [phaseIdToExpand]: true }));

      // Scroll to the course block
      // The timeout helps ensure the element is rendered and phase is expanded
      setTimeout(() => {
        if (typeof courseIdToFocus === 'string' && courseIdToFocus.trim() !== '') {
          // Use the original courseIdToFocus (string) to find the ref,
          // as courseRefs are keyed by the original course.course_id (which can be alphanumeric)
          if (courseRefs.current[courseIdToFocus]) {
            courseRefs.current[courseIdToFocus].scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            // Attempt parsing for purely numeric IDs as a fallback if direct string match failed,
            // though refs should ideally be keyed consistently (e.g. always by string ID)
            const numericAttempt = parseInt(courseIdToFocus, 10);
            if (!isNaN(numericAttempt) && courseRefs.current[numericAttempt]) {
                 courseRefs.current[numericAttempt].scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
                console.warn(`Course ref not found for courseIdToFocus: '${courseIdToFocus}'`);
            }
          }
        }
        // Clean up navigation state to prevent re-triggering on unrelated re-renders
        // Only update state if it needs cleaning to avoid unnecessary re-renders from navigate
        if (location.state?.courseIdToFocus || location.state?.previousPage) {
          navigate(location.pathname, { replace: true, state: { ...location.state, courseIdToFocus: null, previousPage: null } });
        }
      }, 150); // Slightly increased delay to allow for tab switch and phase expansion
    }
  }, [location.state, location.pathname, navigate]); // Add location.pathname to dependency array

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
        shadow-md border-slate-200 overflow-hidden transition-all duration-500
        ${expanded
          ? 'absolute top-0 left-0 w-full z-20'
          : 'relative w-full lg:w-[calc(50%-1rem)] z-10 hover:scale-[1.02] cursor-pointer hover:shadow-xl hover:border-blue-300'}
      `}
      style={{
        transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: expanded ? '0 8px 32px 0 #3b82f622' : undefined,
      }}
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
          <div className="space-y-4 mt-6 w-full p-4">
            <div className="flex flex-col gap-4 w-full">
              {phaseTwoTrainings.map((training, index) => (
                <div 
                  key={training.id}
                  className="p-6 rounded-lg border border-slate-200 
                    transition-all duration-300 ease-in-out
                    hover:scale-[1.01] hover:border-blue-300 hover:shadow-lg 
                    cursor-pointer bg-white group"
                  style={{
                    opacity: 1,
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
          </div>
        )}
      </CardContent>
    </Card>
  );

  async function handleCompleteSubcourse(course_id: string, subcourse_id: string) {
    try {
      const res = await fetch(`http://localhost:8000/trainees/${empId}/progress/complete-subcourse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id, subcourse_id })
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data.progress || []);
      }
    } catch (err) {
      // Optionally handle error
    }
  }

  function getToken() {
    return localStorage.getItem("access_token");
  }

  async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = getToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  // Function to open the modal and fetch short notes
  const handleReattemptTest = useCallback(async (testId: string) => {
    setShowReattemptModal(true);
    setReattemptShortNotes(null);
    setReattemptLoading(true);
    setReattemptError(null);
    setReattemptTestId(testId);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v2/tests/${testId}/short-notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReattemptShortNotes(data.short_notes || "No notes available.");
      } else {
        setReattemptError("Failed to fetch short notes.");
      }
    } catch (err) {
      setReattemptError("Could not connect to the server.");
    } finally {
      setReattemptLoading(false);
    }
  }, []);

  // Function to proceed to test (replace with actual navigation/logic)
  const handleProceedToTest = useCallback(() => {
    setShowReattemptModal(false);
    // TODO: Navigate to test attempt page or trigger test attempt logic
    toast({ title: "Proceeding to test...", description: "(Implement test attempt flow here)" });
  }, [toast]);

  // Fetch quiz data when modal opens and selectedSubcourse changes
  useEffect(() => {
    if (showQuizModal && selectedSubcourse) {
      setQuizLoading(true);
      setQuizError(null);
      setQuizData(null);
      setQuizAnswers({});
      setQuizResult(null);
      const token = localStorage.getItem("access_token");
      fetch(`http://localhost:8000/api/v2/quizzes/by-subcourse/${selectedSubcourse.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.quiz) {
            setQuizData(data.quiz);
          } else {
            setQuizError("No quiz found for this subcourse.");
          }
        })
        .catch(() => setQuizError("Failed to fetch quiz."))
        .finally(() => setQuizLoading(false));
    }
  }, [showQuizModal, selectedSubcourse]);

  // Handle answer change
  const handleQuizAnswer = (questionId: string, value: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Handle quiz submit
  const handleQuizSubmit = async () => {
    if (!quizData || !quizData._id) return;
    setQuizSubmitting(true);
    setQuizResult(null);
    setQuizError(null);
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://localhost:8000/api/v2/quizzes/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quiz_id: quizData._id,
          answers: quizAnswers
        })
      });
      const data = await res.json();
      if (res.ok) {
        setQuizResult(data);
      } else {
        setQuizError(data.detail || "Quiz submission failed.");
      }
    } catch (err) {
      setQuizError("Could not connect to the server.");
    } finally {
      setQuizSubmitting(false);
    }
  };

  if (!traineeState) {
    return <div>Loading...</div>; // Or a more sophisticated loading spinner
  }

  return (
    <TraineeLayout>
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #fff7f0 100%)" }}>
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
              <div className="relative min-h-[250px] h-full" style={{ minHeight: '300px' }}>
                {/* Phase 1 Card */}
                <Card
                  className={`rounded-3xl ${glass} p-6 shadow-xl cursor-pointer transition-all duration-500 min-h-[250px] bg-white overflow-hidden
                    ${expandedPhases[1]
                      ? 'absolute top-0 left-0 w-full z-20'
                      : 'relative w-full lg:w-[calc(50%-1rem)] z-10 hover:scale-105'}
                  `}
                  style={{
                    transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: expandedPhases[1] ? '0 8px 32px 0 #f59e4222' : undefined,
                  }}
                  onClick={() => !expandedPhases[1] && handleExpand(1)}
                >
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
                    <div className="space-y-4 mt-6 w-full p-4">
                      <div className="flex flex-col gap-4 w-full">
                        <AnimatePresence initial={false}>
                          {relevantCourses && relevantCourses.length > 0 ? (
                            relevantCourses.map((course, index) => {
                              // Ensure course and course.subcourses are defined before trying to access properties
                              if (!course || !course.course_id) {
                                console.warn("Skipping render for course with missing course_id:", course);
                                return null; // Skip rendering this course if essential data is missing
                              }
                              const completedCount = progress.find(p => String(p.course_id) === String(course.course_id))?.completed_subcourses.length || 0;
                              const total = Array.isArray(course.subcourses) ? course.subcourses.length : 0;
                              return (
                                <motion.div
                                  key={course.course_id} // Essential: course_id must be unique and present
                                  layoutId={`course-block-${course.course_id}`}
                                  ref={el => { if (course.course_id) courseRefs.current[course.course_id] = el; }}
                                  className="p-0 rounded-xl border border-orange-200 bg-white/90 shadow transition-all duration-200 cursor-pointer min-h-[72px] hover:bg-orange-50 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 will-change-transform"
                                  tabIndex={0}
                                  whileTap={{ scale: 0.97, boxShadow: '0 8px 32px 0 #f59e4244', backgroundColor: '#fff7f0' }}
                                  onClick={() => navigate(`/training/course/${course.course_id}`, { state: { courseId: course.course_id, user: traineeState, empId: empId } })}
                                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/training/course/${course.course_id}`, { state: { courseId: course.course_id, user: traineeState, empId: empId } }); }}
                                  aria-label={`Open ${course.title || 'Unnamed Course'}`}
                                >
                                  <div className="flex items-center gap-3 justify-between px-6 py-4 select-none rounded-xl focus:outline-none">
                                    <div className="flex items-center gap-3">
                                      <h3 className="text-lg font-semibold group-hover:text-orange-600 transition-colors duration-300">
                                        {course.title || 'Unnamed Course'}
                                      </h3>
                                      <span className="ml-3 text-xs bg-orange-100 text-orange-700 rounded-full px-3 py-0.5 font-semibold">
                                        {completedCount}/{total} completed
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })
                          ) : (
                            <p className="text-gray-500">No courses available for your batch or common to all.</p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </Card>
                {/* Phase 2 Card */}
                {!expandedPhases[1] && (
                  <div
                    className={`transition-all duration-500 ${traineeState.score >= 80 ? 'absolute right-0 top-0 w-full lg:w-[calc(50%-1rem)] z-10' : 'absolute right-0 top-0 w-full lg:w-[calc(50%-1rem)] z-10 opacity-60 pointer-events-none'}`}
                    style={{
                      transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  >
                    {traineeState.score >= 80 ? (
                      <UnlockedPhaseCard expanded={expandedPhases[2]} onExpand={() => handleExpand(2)} onCollapse={e => handleCollapse(e, 2)} />
                    ) : (
                      <LockedPhaseCard expanded={expandedPhases[2]} onExpand={() => handleExpand(2)} onCollapse={e => handleCollapse(e, 2)} hFull />
                    )}
                  </div>
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
                {/* DEMO: Re-attempt Test Button (replace with real test data/logic) */}
                <Button onClick={() => handleReattemptTest("demo-test-id-123")}>
                  Re-attempt Test
                </Button>
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
                {analytics ? (
                  <>
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg mb-2">AI Insights</h3>
                      <div className="prose max-w-none">
                        <ReactMarkdown>{analytics.ai_insights?.recommendations || "No insights yet."}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="font-semibold">Progress</div>
                        <div className="text-2xl">{analytics.progress?.overall || 0}%</div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4">
                        <div className="font-semibold">Average Score</div>
                        <div className="text-2xl">{analytics.avg_score?.toFixed(2) || 0}%</div>
                      </div>
                      <div className="bg-yellow-50 rounded-xl p-4">
                        <div className="font-semibold">Quiz Pass Rate</div>
                        <div className="text-2xl">{analytics.quiz_pass_rate?.toFixed(2) || 0}%</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>Loading analytics...</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiz/Task Modal Enhanced */}
      {showQuizModal && selectedSubcourse && (
        <Dialog open={showQuizModal} onOpenChange={setShowQuizModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Quiz: {selectedSubcourse.title}</DialogTitle>
              <DialogDescription>
                Course: {courses.find(c => c.subcourses.some(s => s.id === selectedSubcourse.id))?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="text-gray-600">
              {quizLoading && <div>Loading quiz...</div>}
              {quizError && <div className="text-red-600">{quizError}</div>}
              {quizData && !quizResult && (
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleQuizSubmit(); }}>
                  {quizData.questions && quizData.questions.length > 0 ? (
                    quizData.questions.map((q, idx) => (
                      <div key={q._id || idx} className="mb-4">
                        <div className="font-semibold mb-2">{idx + 1}. {q.text}</div>
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-1">
                            {q.options.map((opt, oidx) => (
                              <label key={oidx} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`question-${q._id}`}
                                  value={opt}
                                  checked={quizAnswers[q._id] === opt}
                                  onChange={() => handleQuizAnswer(q._id, opt)}
                                  disabled={quizSubmitting}
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div>No questions found in this quiz.</div>
                  )}
                  <DialogFooter>
                    <Button type="submit" disabled={quizSubmitting || Object.keys(quizAnswers).length !== quizData.questions.length}>
                      {quizSubmitting ? "Submitting..." : "Submit Quiz"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowQuizModal(false)} disabled={quizSubmitting}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </form>
              )}
              {quizResult && (
                <div className="mt-4">
                  <div className="font-semibold text-green-700 mb-2">Quiz Submitted!</div>
                  <div>Score: <span className="font-bold">{quizResult.score ?? "-"}</span></div>
                  {quizResult.feedback && <div className="mt-2 text-gray-700">Feedback: {quizResult.feedback}</div>}
                  <DialogFooter>
                    <Button onClick={() => setShowQuizModal(false)}>Close</Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Change Password Modal for first-time login */}
      {showChangePasswordModal && (
        <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set Your Password</DialogTitle>
              <DialogDescription>
                Please set a new password to continue. Your temporary password must be changed before you can use the dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* New Password Field with requirements and show/hide button inside input */}
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
                {/* Password requirements directly under new password input */}
                <div className="space-y-1 mt-2">
                  {pwChecks.map((c, i) => (
                    <div key={i} className={`text-sm ${c.valid ? 'text-green-600' : 'text-gray-400'}`}>• {c.label}</div>
                  ))}
                </div>
              </div>
              {/* Confirm Password Field with show/hide button inside input */}
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
                {/* Real-time password match feedback */}
                {confirmPassword && newPassword && (
                  <div className={`text-sm mt-2 ${confirmPassword === newPassword ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {confirmPassword === newPassword ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>
              {/* Error messages */}
              <div className="space-y-1">
                {passwordError && <div className="text-red-600 text-sm">{passwordError}</div>}
                {confirmError && <div className="text-red-600 text-sm">{confirmError}</div>}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePasswordChange} disabled={isChanging || !allPwChecks || !passwordsMatch}>
                {isChanging ? 'Changing...' : 'Set Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Re-attempt Test Modal */}
      <Dialog open={showReattemptModal} onOpenChange={setShowReattemptModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Short Notes Before Re-attempt</DialogTitle>
            <DialogDescription>
              Please review these AI-generated notes before re-attempting your test.
            </DialogDescription>
          </DialogHeader>
          <div className="text-gray-700 min-h-[80px]">
            {reattemptLoading && <div>Loading short notes...</div>}
            {reattemptError && <div className="text-red-600">{reattemptError}</div>}
            {reattemptShortNotes && (
              <div className="prose max-w-none">
                <ReactMarkdown>{reattemptShortNotes}</ReactMarkdown>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleProceedToTest} disabled={reattemptLoading}>
              Proceed to Test
            </Button>
            <Button variant="ghost" onClick={() => setShowReattemptModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TraineeLayout>
  );
};

export default TraineeDashboard;
