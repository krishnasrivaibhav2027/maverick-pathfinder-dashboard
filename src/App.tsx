import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import TraineeDashboard from "./pages/TraineeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import PhaseTrainings from "./pages/PhaseTrainings";
import ActiveBatches from "./pages/ActiveBatches";
import NextBatchOverflow from "./pages/NextBatchOverflow";
import CourseDetailPage from "./pages/CourseDetailPage";
import TraineeLayout from "./components/TraineeLayout";
import AdminLayout from "./components/AdminLayout";
import AdminTraineeDetail from "./pages/AdminTraineeDetail";
import PhaseSelection from "./pages/batchflow/PhaseSelection";
import BatchList from "./pages/batchflow/BatchList";
import SkillGroupList from "./pages/batchflow/SkillGroupList";
import TraineeList from "./pages/batchflow/TraineeList";
import TraineeDetail from "./pages/batchflow/TraineeDetail";


const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Check for either trainee or admin login
  const isTrainee = Boolean(localStorage.getItem("empId"));
  const isAdmin = localStorage.getItem("is_admin") === "true";
  if (!isTrainee && !isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
            <Route element={<TraineeLayout><Outlet /></TraineeLayout>}>
              <Route path="/trainee-dashboard/:empId" element={<TraineeDashboard />} />
              <Route path="/trainee-dashboard/:empId/phase/:phaseId" element={<PhaseTrainings />} />
              <Route path="/training/course/:courseId" element={<CourseDetailPage />} />
            </Route>
            <Route element={<AdminLayout><Outlet /></AdminLayout>}>
              <Route path="/admin-dashboard" element={<Navigate to="/admin-dashboard/overview" replace />} />
              <Route path="/admin-dashboard/:tab" element={<AdminDashboard />} />
              <Route path="/admin-dashboard/trainees/:empId" element={<AdminTraineeDetail />} />
              <Route path="/admin/active-batches" element={<ActiveBatches />}/>
              <Route path="/admin/active-batches" >
                <Route index element={<PhaseSelection />} />
                <Route path="phase/:phaseId" element={<BatchList />} />
                <Route path="phase/:phaseId/batch/:batchId" element={<SkillGroupList />} />
                <Route path="phase/:phaseId/batch/:batchId/skill/:skill" element={<TraineeList />} />
                <Route path="phase/:phaseId/batch/:batchId/skill/:skill/trainee/:empId" element={<TraineeDetail />} />
              </Route>
              <Route path="/admin/next-batch" element={<NextBatchOverflow />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
