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
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/active-batches" element={<ActiveBatches />} />
            <Route path="/admin/next-batch" element={<NextBatchOverflow />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
