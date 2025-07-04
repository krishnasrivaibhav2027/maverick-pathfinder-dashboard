import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import TraineeDashboard from "./pages/TraineeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import PhaseTrainings from "./pages/PhaseTrainings";
import ActiveBatches from "./pages/ActiveBatches";
import NextBatchOverflow from "./pages/NextBatchOverflow";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/trainee-dashboard/:empId" element={<TraineeDashboard />} />
          <Route path="/trainee-dashboard/:empId/phase/:phaseId" element={<PhaseTrainings />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/batches" element={<ActiveBatches />} />
          <Route path="/admin/next-batch" element={<NextBatchOverflow />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
