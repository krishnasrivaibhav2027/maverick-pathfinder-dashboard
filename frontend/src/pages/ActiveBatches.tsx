import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BatchManagement from "@/components/BatchManagement";
import { Users } from "lucide-react";

const accent = "#FF512F";
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

const ActiveBatches: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #fff7f0 100%)" }}>
      <div className={`rounded-3xl ${glass} p-6 flex items-center gap-4 mb-8 shadow-xl`} style={{ boxShadow: `0 8px 32px 0 ${accent}22` }}>
        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-full px-5 py-2 font-semibold border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80" style={font}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-orange-500" style={font}>
          <Users className="h-6 w-6 text-orange-400" />
          Manage Training Batches
        </h1>
      </div>
      <BatchManagement />
    </div>
  );
};

export default ActiveBatches; 