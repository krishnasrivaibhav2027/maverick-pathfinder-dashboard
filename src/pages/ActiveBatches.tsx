import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BatchManagement from "@/components/BatchManagement";
import { Users } from "lucide-react";

const accent = "#FF512F";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

const ActiveBatches: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      {/* Header section */}
      <div className="flex items-center gap-4 mb-6 mt-2 pl-0">
        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-full px-5 py-2 font-semibold border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80" style={font}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-orange-500" style={font}>
          <Users className="h-6 w-6 text-orange-400" />
          Manage Training Batches
        </h1>
      </div>
      {/* Main content section (phase selection, refresh, etc.) */}
      <div className="pl-0">
        <BatchManagement />
      </div>
    </div>
  );
};

export default ActiveBatches; 